<template>
  <div id="app">
    <div class="header">可售楼盘展示 -- {{ nowTime }}</div>
    <div class="search" v-for="(item, index) in name" :key="index">
      <span>项目名称：</span>
      <input v-model="name[index]" />
      <span style="margin-left: 2px">项目区域:</span>
      <select v-model="rangeMap[index]">
        <option value="工业园区">工业园区</option>
        <option value="吴中区">吴中区</option>
        <option value="相城区">相城区</option>
        <option value="高新区">高新区</option>
        <option value="姑苏区">姑苏区</option>
        <option value="吴江区">吴江区</option>
      </select>
      <span style="margin: 0 -5px 0 20px">公司名称：</span>
      <input v-model="organization[index]" />
      <span v-if="index === 0">
        <button id="search" @click="startSearch(0)" :disabled="searchLoading">
          查询
        </button>
        <button id="save" @click="startSave" :disabled="saveLoading">
          存储
        </button>
        <span style="margin: 0 -5px 0 20px">选择对比日期：</span>
        <input v-model="compareDate" type="date" />
        <button id="compare" @click="startCompare" :disabled="compareLoading">
          对比
        </button>
      </span>
    </div>
    <div style="margin: 15px 0 0 0">
      <table
        align="center"
        border="0"
        cellpadding="0"
        cellspacing="0"
        style="
          table-layout: auto;
          width: 100;
          border-collapse: collapse;
          height: 6px;
        "
      >
        <tbody>
          <tr align="middle" class="a12">
            <td bgcolor="#66cc33" width="20">&nbsp;</td>
            <td bgcolor="#ffffff" width="20%">可售</td>
            <td bgcolor="Yellow" width="20">&nbsp;</td>
            <td bgcolor="#ffffff" width="20%">签约中</td>
            <td bgcolor="#cccccc" width="20">&nbsp;</td>
            <td bgcolor="#ffffff" width="20%">不可售</td>
            <td bgcolor="#666600" width="20">&nbsp;</td>
            <td bgcolor="#ffffff" width="20%">限制中</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="req" v-if="reflush">
      <div v-for="itemPc in pcInfo" :key="itemPc.code">
        <div class="pc-title">
          【{{ itemPc.name }} 】- {{ itemPc.organization }} - 标识码：{{
            itemPc.code
          }}
        </div>
        <div
          v-for="itemLou in itemPc.louInfo"
          :key="itemLou.code"
          class="lou-div"
        >
          <div class="lou-title">
            【{{ itemLou.number }} 】 - 标识码：{{ itemLou.code }}
          </div>
          <div
            :id="itemLou.code"
            v-html="itemLou.fwInfo"
            @click="changeStatus"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import axios from "axios";

@Component
export default class App extends Vue {
  reflush = true;
  searchLoading = false;
  compareLoading = false;
  saveLoading = false;
  name = ["璀璨平江如苑", "云起平江雅园", "平江新著雅园", "印象平江花园"];
  rangeMap = ["姑苏区", "姑苏区", "姑苏区", "姑苏区"];
  organization = [
    "苏州平泰置业有限公司",
    "苏州祥都置业有限公司",
    "苏州星河博源房地产开发有限公司",
    "苏州宸竣房地产开发有限公司",
  ];
  compareDate = "";
  pcInfo: {
    code: string;
    louInfo: {
      code: string;
      fwInfo: string;
      number: string;
    }[];
  }[] = [];
  code = "";
  nowTime = "";

  startSearch(i: number): void {
    this.searchLoading = true;
    if (i === 0) this.pcInfo = [];
    axios
      .post("/apicc/searchPc", {
        name: this.name[i],
        rangeMap: this.rangeMap[i],
        organization: this.organization[i],
      })
      .then((req) => {
        if (req.data.code === 0) {
          if (req.data.data.length === 0) {
            this.startSearch(i);
            return;
          }
          this.code = req.data.VCode;
          this.pcInfo = this.pcInfo.concat(req.data.data);
          if (i < this.name.length - 1)
            setTimeout(() => {
              this.startSearch(i + 1);
            }, 1000);
          else
            setTimeout(() => {
              this.getLouInfo(0);
            }, 1000);
        } else {
          this.startSearch(i);
        }
      })
      .catch((error) => {
        this.startSearch(i);
        console.log(error);
      });
  }

  getLouInfo(index: number): void {
    axios
      .get(
        `/apicc/searchLou?SPJ_ID=${this.pcInfo[index].code}&code=${this.code}`
      )
      .then((req) => {
        if (req.data.code === 0) {
          if (req.data.data.length === 0) {
            this.getLouInfo(index);
            return;
          }
          this.$set(
            this.pcInfo[index],
            "louInfo",
            req.data.data.sort(
              (a: { number: number }, b: { number: number }) => {
                return a.number - b.number;
              }
            )
          );
          if (index < this.pcInfo.length - 1)
            setTimeout(() => {
              this.getLouInfo(index + 1);
            }, 1000);
          else {
            setTimeout(() => {
              this.getFwInfo(0, 0);
            }, 1000);
          }
        } else {
          this.getLouInfo(index);
        }
      })
      .catch((error) => {
        this.getLouInfo(index);
        console.log(error);
      });
  }

  getFwInfo(FIndex: number, index: number): void {
    axios
      .get(
        `/apicc/searchFw?PBTAB_ID=${this.pcInfo[FIndex].louInfo[index].code}&code=${this.code}`
      )
      .then((req) => {
        if (req.data.code === 0) {
          this.$set(
            this.pcInfo[FIndex].louInfo[index],
            "fwInfo",
            this.formatFWInfo(req.data.data)
          );
          if (index < this.pcInfo[FIndex].louInfo.length - 1)
            setTimeout(() => {
              this.getFwInfo(FIndex, index + 1);
            }, 1000);
          else if (FIndex < this.pcInfo.length - 1) {
            setTimeout(() => {
              this.getFwInfo(FIndex + 1, 0);
            }, 1000);
          } else {
            this.searchLoading = false;
            this.reflushFWView();
          }
        } else {
          this.getFwInfo(FIndex, index);
        }
      })
      .catch((error) => {
        this.getFwInfo(FIndex, index);
        console.log(error);
      });
  }

  formatFWInfo(info: string): string {
    return info.replace(
      /bgcolor="([#a-zA-Z0-9]+)"/g,
      (rs: string, $1: string) => {
        return `style="background-color:${$1};"`;
      }
    );
  }

  changeStatus(item: MouseEvent): void {
    if (item.target) (item.target as Element).classList.toggle("changed");
  }

  formatDate = (date: Date | string, fmt = "yyyy-MM-dd hh:mm:ss"): string => {
    if (typeof date === "string") {
      return date;
    }

    let fmtCopy = fmt;

    if (!date || date === null) return "";
    const o = {
      "M+": date.getMonth() + 1, // 月份
      "d+": date.getDate(), // 日
      "h+": date.getHours(), // 小时
      "m+": date.getMinutes(), // 分
      "s+": date.getSeconds(), // 秒
      "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
      S: date.getMilliseconds(), // 毫秒
    };
    if (/(y+)/.test(fmtCopy))
      fmtCopy = fmtCopy.replace(
        RegExp.$1,
        `${date.getFullYear()}`.substr(4 - RegExp.$1.length)
      );
    Object.keys(o).forEach((k) => {
      if (new RegExp(`(${k})`).test(fmtCopy))
        fmtCopy = fmtCopy.replace(
          RegExp.$1,
          RegExp.$1.length === 1 ? o[k] : `00${o[k]}`.substr(`${o[k]}`.length)
        );
    });
    return fmtCopy;
  };

  getHighLightDifferent(newData: string, oldData: string): string {
    var oldFw = oldData.match(/<td([\S\s]*?)td>/g);
    var newFw = newData.match(/<td([\S\s]*?)td>/g);
    if (oldFw)
      oldFw.forEach((element, index) => {
        if (newFw) {
          newFw[index].replaceAll('class="changed" ', "");
          if (element !== newFw[index]) {
            console.log(element);
            console.log(newFw[index]);
            newData = newData.replace(
              newFw[index],
              newFw[index].replace('style="', 'class="changed" style="')
            );
          }
        }
      });
    return newData;
  }

  reflushFWView(): void {
    this.reflush = false;
    this.$nextTick(() => {
      this.reflush = true;
    });
  }

  startCompare(): void {
    this.compareLoading = true;
    try {
      this.pcInfo.forEach((pc) => {
        pc.louInfo.forEach((lou) => {
          axios
            .get(
              `/apicc/getLouData?code=${lou.code}&date=${this.compareDate}`,
              {}
            )
            .then((req) => {
              if (req.data.code === 0) {
                if (req.data.data.length === 0) {
                  throw new Error("无历史数据，退出对比");
                }
                lou.fwInfo = this.getHighLightDifferent(
                  lou.fwInfo.replaceAll('class="changed" ', ""),
                  this.formatFWInfo(req.data.data)
                );
                this.reflushFWView();
              } else {
                throw new Error("请求错误，退出对比");
              }
            })
            .catch((error) => {
              console.log(error);
            });
        });
      });
      this.compareLoading = false;
    } catch (error) {
      this.compareLoading = false;
      console.log(error);
    }
  }

  startSave(): void {
    this.saveLoading = true;
    const date = this.formatDate(new Date(), "yyyy-MM-dd");
    try {
      this.pcInfo.forEach((pc) => {
        pc.louInfo.forEach((lou) => {
          axios
            .post("/apicc/saveLouData", {
              code: lou.code,
              date: date,
              data: lou.fwInfo,
            })
            .then((req) => {
              if (req.data.code !== 0) {
                throw new Error("请求错误，退出存储");
              }
            })
            .catch((error) => {
              console.log(error);
            });
        });
      });
      this.saveLoading = false;
    } catch (error) {
      this.saveLoading = false;
      console.log(error);
    }
  }

  mounted(): void {
    this.compareDate = this.formatDate(
      new Date(new Date().getTime() - 24 * 3600000),
      "yyyy-MM-dd"
    );
    setInterval(() => {
      const temp = this.formatDate(new Date());
      this.nowTime = temp || `${new Date()}`;
    });
  }
}
</script>

<style lang="less">
body {
  padding: 8px;
  margin: 0 auto;
}
#app {
  padding: 2px 2px 10px 2px;
  margin: auto;
  border: 1px solid black;
}
.search {
  line-height: 29px;
  height: 29px;
  margin-left: 1px;
  text-align: left;
  span {
    vertical-align: middle;
  }
  input {
    vertical-align: middle;
    width: 175px;
    height: 20px;
    font-size: 16px;
    margin-left: 8px;
  }
  select {
    vertical-align: middle;
    height: 24px;
    font-size: 16px;
    margin: 0 0 0 18px;
  }
  button {
    vertical-align: middle;
    height: 26px;
    font-size: 16px;
    margin-left: 2px;
  }
}
.lou-div {
  display: inline-block;
  .changed {
    border: solid red 4px;
  }
}
.header {
  background-color: #ff9933;
  width: 100%;
  height: 42px;
  line-height: 42px;
  font-weight: bold;
  font-size: 18px;
  color: white;
  font-family: 幼圆;
  text-align: center;
}
</style>
