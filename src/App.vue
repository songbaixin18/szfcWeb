<template>
  <div id="app">
    <div class="header">可售楼盘展示 -- {{ nowTime }}</div>
    <div class="search">
      <span>项目名称：</span>
      <input v-model="name" />
      <span style="margin-left: 2px">项目区域:</span>
      <select v-model="rangeMap">
        <option value="工业园区">工业园区</option>
        <option value="吴中区">吴中区</option>
        <option value="相城区">相城区</option>
        <option value="高新区">高新区</option>
        <option value="姑苏区">姑苏区</option>
        <option value="吴江区">吴江区</option>
      </select>
      <span style="margin: 0 -5px 0 20px">公司名称：</span>
      <input v-model="organization" />
      <button @click="search" :disabled="loading">查询</button>
    </div>
    <div style="margin: 15px 0 0 0">
      <table
        align="center"
        border="0"
        cellpadding="0"
        cellspacing="0"
        style="table-layout: auto;
        width: 100; border-collapse: collapse; height: 6px"
      >
        <tbody>
          <tr align="middle" class="a12">
            <td bgcolor="#66cc33" width="20">
              &nbsp;
            </td>
            <td bgcolor="#ffffff" width="20%">
              可售
            </td>
            <td bgcolor="Yellow" width="20">
              &nbsp;
            </td>
            <td bgcolor="#ffffff" width="20%">
              签约中
            </td>
            <td bgcolor="#cccccc" width="20">
              &nbsp;
            </td>
            <td bgcolor="#ffffff" width="20%">
              不可售
            </td>
            <td bgcolor="#666600" width="20">
              &nbsp;
            </td>
            <td bgcolor="#ffffff" width="20%">
              限制中
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="req">
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
          <div :id="itemLou.code"></div>
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
  loading = false;
  name = "璀璨平江如苑";
  rangeMap = "姑苏区";
  organization = "苏州平泰置业有限公司";
  pcInfo: {
    code: string;
    louInfo: {
      code: string;
    }[];
  }[] = [];
  code = "";

  nowTime = "";

  search(): void {
    this.loading = true;
    axios
      .post("/apicc/searchPc", {
        name: this.name,
        rangeMap: this.rangeMap,
        organization: this.organization
      })
      .then(req => {
        console.log(req.data);
        if (req.data.code === 0) {
          this.code = req.data.VCode;
          this.pcInfo = req.data.data;
          setTimeout(() => {
            this.getLouInfo(0);
          }, 1000);
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  getLouInfo(index: number): void {
    axios
      .get(
        `/apicc/searchLou?SPJ_ID=${this.pcInfo[index].code}&code=${this.code}`
      )
      .then(req => {
        console.log(req.data);
        if (req.data.code === 0) {
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
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  getFwInfo(FIndex: number, index: number): void {
    axios
      .get(
        `/apicc/searchFw?PBTAB_ID=${this.pcInfo[FIndex].louInfo[index].code}&code=${this.code}`
      )
      .then(req => {
        if (req.data.code === 0) {
          this.$set(
            this.pcInfo[FIndex].louInfo[index],
            "fwInfo",
            req.data.data
          );
          const tempHtmlNode = document.getElementById(
            this.pcInfo[FIndex].louInfo[index].code
          );
          if (tempHtmlNode) tempHtmlNode.innerHTML = req.data.data;
          if (index < this.pcInfo[FIndex].louInfo.length - 1)
            setTimeout(() => {
              this.getFwInfo(FIndex, index + 1);
            }, 1000);
          else if (FIndex < this.pcInfo.length - 1) {
            setTimeout(() => {
              this.getFwInfo(FIndex + 1, 0);
            }, 1000);
          } else {
            document.querySelectorAll("td").forEach(item => {
              item.addEventListener("click", () => {
                item.classList.toggle("changed");
              });
            });
            this.loading = false;
          }
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  formatDate = (
    date: Date | string,
    fmt = "yyyy-MM-dd hh:mm:ss"
  ): string | null => {
    if (typeof date === "string") {
      return date;
    }

    let fmtCopy = fmt;

    if (!date || date === null) return null;
    const o = {
      "M+": date.getMonth() + 1, // 月份
      "d+": date.getDate(), // 日
      "h+": date.getHours(), // 小时
      "m+": date.getMinutes(), // 分
      "s+": date.getSeconds(), // 秒
      "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
      S: date.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmtCopy))
      fmtCopy = fmtCopy.replace(
        RegExp.$1,
        `${date.getFullYear()}`.substr(4 - RegExp.$1.length)
      );
    Object.keys(o).forEach(k => {
      if (new RegExp(`(${k})`).test(fmtCopy))
        fmtCopy = fmtCopy.replace(
          RegExp.$1,
          RegExp.$1.length === 1 ? o[k] : `00${o[k]}`.substr(`${o[k]}`.length)
        );
    });
    return fmtCopy;
  };

  mounted(): void {
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
