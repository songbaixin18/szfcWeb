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
    "苏州宸竣房地产开发有限公司"
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
        organization: this.organization[i]
      })
      .then(req => {
        if (req.data.code === 0) {
          if (req.data.data.length === 0) {
            setTimeout(() => {
              this.startSearch(i + 1);
            }, 1000);
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
          setTimeout(() => {
            this.startSearch(i + 1);
          }, 1000);
        }
      })
      .catch(error => {
        setTimeout(() => {
          this.startSearch(i + 1);
        }, 1000);
        console.log(error);
      });
  }

  getLouInfo(index: number): void {
    axios
      .get(
        `/apicc/searchLou?SPJ_ID=${this.pcInfo[index].code}&code=${this.code}`
      )
      .then(req => {
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
      .catch(error => {
        this.getLouInfo(index);
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
      .catch(error => {
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
      this.pcInfo.forEach(pc => {
        pc.louInfo.forEach(lou => {
          axios
            .get(
              `/apicc/getLouData?code=${lou.code}&date=${this.compareDate}`,
              {}
            )
            .then(req => {
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
            .catch(error => {
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
      this.pcInfo.forEach(pc => {
        pc.louInfo.forEach(lou => {
          axios
            .post("/apicc/saveLouData", {
              code: lou.code,
              date: date,
              data: lou.fwInfo
            })
            .then(req => {
              if (req.data.code !== 0) {
                throw new Error("请求错误，退出存储");
              }
            })
            .catch(error => {
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
      new Date(new Date().getTime() - 24 * 3600000 * 7),
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
    position: relative;
    color: red;
    font-weight: bold;
  }
  .changed:before {
    position: absolute;
    width: 10px;
    height: 10px;
    top: -2px;
    content: " ";
    background-size: cover;
    background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNjM4NDk5OTU2MzM0IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjMxODQiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PGRlZnM+PHN0eWxlIHR5cGU9InRleHQvY3NzIj48L3N0eWxlPjwvZGVmcz48cGF0aCBkPSJNODYxLjMgNzQ0Yy01Ny42IDU5LjYtOTQgNTEuMS0xMjIuNSAyMy42cy0zOC4zLTYzLjYgMTkuMy0xMjMuM2M1Ny42LTU5LjYgMTg5LjMtOTIuNyAxODkuMy05Mi43UzkxOC45IDY4NC40IDg2MS4zIDc0NHoiIGZpbGw9IiNGRkM3NEEiIHAtaWQ9IjMxODUiPjwvcGF0aD48cGF0aCBkPSJNODYxLjMgNzQ0YzU3LjYtNTkuNiA4Ni4xLTE5Mi40IDg2LjEtMTkyLjRsLTIwOC42IDIxNmMyOC41IDI3LjUgNjQuOSAzNi4xIDEyMi41LTIzLjZ6IiBmaWxsPSIjMjMxODE1IiBvcGFjaXR5PSIuMiIgcC1pZD0iMzE4NiI+PC9wYXRoPjxwYXRoIGQ9Ik04MjAuOCA3MDUuMmMtNTkuNy01LjQtNzUuNiAxNi41LTc4LjIgNDUtMC4yIDEuOC0wLjMgMy42LTAuMyA1LjMtMC4xIDUuMiAwLjMgMTAuMyAxLjYgMTUuMSAwLjIgMC44IDAuNSAxLjUgMC43IDIuMiA1LjQgNC42IDExLjIgOC40IDE3LjMgMTEuMSA2LjIgMi44IDEyLjkgNC41IDIwIDQuOCA0LjcgMC4yIDkuNy0wLjMgMTQuOS0xLjQgNi45LTEuNiAxNC4zLTQuNSAyMi04LjkgMi4yLTEuMiA0LjQtMi42IDYuNy00IDMuNi0yLjMgNy4yLTQuOSAxMS03LjggNy44LTYuMSAxNi4xLTEzLjQgMjQuOC0yMi41IDYuMi02LjQgMTItMTMuOCAxNy42LTIxLjYtMTkuMy04LjgtMzkuNi0xNS42LTU4LjEtMTcuM3oiIGZpbGw9IiMyMzE4MTUiIG9wYWNpdHk9Ii4yIiBwLWlkPSIzMTg3Ij48L3BhdGg+PHBhdGggZD0iTTgxMS40IDgyNy4yYy01OS43LTUuNC03MS40LTI5LjgtNjguOS01OC4zIDIuNi0yOC41IDE4LjUtNTAuNCA3OC4yLTQ1IDU5LjcgNS40IDEzOCA2NC42IDEzOCA2NC42cy04Ny42IDQ0LjEtMTQ3LjMgMzguN3oiIGZpbGw9IiNGRkM3NEEiIHAtaWQ9IjMxODgiPjwvcGF0aD48cGF0aCBkPSJNODExLjQgODI3LjJjNTkuNyA1LjQgMTQ3LjQtMzguOCAxNDcuNC0zOC44bC0yMTYuMy0xOS42Yy0yLjUgMjguNiA5LjIgNTMgNjguOSA1OC40eiIgZmlsbD0iIzIzMTgxNSIgb3BhY2l0eT0iLjIiIHAtaWQ9IjMxODkiPjwvcGF0aD48cGF0aCBkPSJNMTYyLjcgMzM4LjFjNTcuNiA1OS42IDk0IDUxLjEgMTIyLjUgMjMuNnMzOC4zLTYzLjYtMTkuMy0xMjMuMy0xODkuMy05Mi43LTE4OS4zLTkyLjcgMjguNSAxMzIuOCA4Ni4xIDE5Mi40eiIgZmlsbD0iI0ZGQzc0QSIgcC1pZD0iMzE5MCI+PC9wYXRoPjxwYXRoIGQ9Ik0xNjIuNyAzMzguMWMtNTcuNi01OS42LTg2LjEtMTkyLjQtODYuMS0xOTIuNGwyMDguNiAyMTZjLTI4LjUgMjcuNS02NC45IDM2LjEtMTIyLjUtMjMuNnoiIGZpbGw9IiMyMzE4MTUiIG9wYWNpdHk9Ii4yIiBwLWlkPSIzMTkxIj48L3BhdGg+PHBhdGggZD0iTTIwMy4yIDI5OS4zYzU5LjctNS40IDc1LjYgMTYuNSA3OC4yIDQ1IDAuMiAxLjggMC4zIDMuNiAwLjMgNS4zIDAuMSA1LjItMC4zIDEwLjMtMS42IDE1LjEtMC4yIDAuOC0wLjUgMS41LTAuNyAyLjItNS40IDQuNi0xMS4yIDguNC0xNy4zIDExLjEtNi4yIDIuOC0xMi45IDQuNS0yMCA0LjgtNC43IDAuMi05LjctMC4zLTE0LjktMS40LTYuOS0xLjYtMTQuMy00LjUtMjItOC45LTIuMi0xLjItNC40LTIuNi02LjctNC0zLjYtMi4zLTcuMi00LjktMTEtNy44LTcuOC02LjEtMTYuMS0xMy40LTI0LjgtMjIuNS02LjItNi40LTEyLTEzLjgtMTcuNi0yMS42IDE5LjMtOC44IDM5LjYtMTUuNiA1OC4xLTE3LjN6IiBmaWxsPSIjMjMxODE1IiBvcGFjaXR5PSIuMiIgcC1pZD0iMzE5MiI+PC9wYXRoPjxwYXRoIGQ9Ik0yMTIuNiA0MjEuM2M1OS43LTUuNCA3MS40LTI5LjggNjguOS01OC4zLTIuNi0yOC41LTE4LjUtNTAuNC03OC4yLTQ1LTU5LjcgNS40LTEzOCA2NC42LTEzOCA2NC42czg3LjYgNDQuMSAxNDcuMyAzOC43eiIgZmlsbD0iI0ZGQzc0QSIgcC1pZD0iMzE5MyI+PC9wYXRoPjxwYXRoIGQ9Ik0yMTIuNiA0MjEuM2MtNTkuNyA1LjQtMTQ3LjQtMzguOC0xNDcuNC0zOC44bDIxNi4zLTE5LjZjMi41IDI4LjYtOS4yIDUzLTY4LjkgNTguNHoiIGZpbGw9IiMyMzE4MTUiIG9wYWNpdHk9Ii4yIiBwLWlkPSIzMTk0Ij48L3BhdGg+PHBhdGggZD0iTTcyNC43IDMxNi41Yy00Ny45LTctODkuMy0zNy0xMTAuNy04MC40LTUzLjktMTA5LjMtMjA5LjgtMTA5LjMtMjYzLjcgMC0yMS40IDQzLjQtNjIuOCA3My41LTExMC43IDgwLjRDMTE4LjkgMzM0IDcwLjggNDgyLjIgMTU4LjEgNTY3LjNjMzQuNyAzMy44IDUwLjUgODIuNSA0Mi4zIDEzMC4yLTIwLjYgMTIwLjEgMTA1LjUgMjExLjcgMjEzLjQgMTU1IDQyLjgtMjIuNSA5NC0yMi41IDEzNi45IDAgMTA3LjkgNTYuNyAyMzQtMzQuOSAyMTMuNC0xNTUtOC4yLTQ3LjcgNy42LTk2LjQgNDIuMy0xMzAuMiA4Ny4xLTg1LjEgMzguOS0yMzMuMy04MS43LTI1MC44eiIgZmlsbD0iI0NFMDAwMCIgcC1pZD0iMzE5NSI+PC9wYXRoPjxwYXRoIGQ9Ik03MjQuNyAzMTYuNWMtNDcuOS03LTg5LjMtMzctMTEwLjctODAuNC01My45LTEwOS4zLTIwOS44LTEwOS4zLTI2My43IDAtMjEuNCA0My40LTYyLjggNzMuNS0xMTAuNyA4MC40QzExOC45IDMzNCA3MC44IDQ4Mi4yIDE1OC4xIDU2Ny4zYzM0LjcgMzMuOCA1MC41IDgyLjUgNDIuMyAxMzAuMi0yMC42IDEyMC4xIDEwNS41IDIxMS43IDIxMy40IDE1NSA0Mi44LTIyLjUgOTQtMjIuNSAxMzYuOSAwIDEwNy45IDU2LjcgMjM0LTM0LjkgMjEzLjQtMTU1LTguMi00Ny43IDcuNi05Ni40IDQyLjMtMTMwLjIgODcuMS04NS4xIDM4LjktMjMzLjMtODEuNy0yNTAuOHoiIGZpbGw9IiMyMzE4MTUiIG9wYWNpdHk9Ii4zIiBwLWlkPSIzMTk2Ij48L3BhdGg+PHBhdGggZD0iTTI4MyA3MzQuMmM0Mi41IDYuMiA3OS4yIDMyLjkgOTguMiA3MS40IDQ3LjggOTYuOSAxODYuMSA5Ni45IDIzMy45IDAgMTktMzguNSA1NS43LTY1LjIgOTguMi03MS40IDEwNy0xNS41IDE0OS43LTE0NyA3Mi4zLTIyMi41LTMwLjctMzAtNDQuOC03My4xLTM3LjUtMTE1LjUgMTguMy0xMDYuNi05My42LTE4Ny44LTE4OS4zLTEzNy41LTM4IDIwLTgzLjQgMjAtMTIxLjQgMC05NS43LTUwLjMtMjA3LjUgMzAuOS0xODkuMyAxMzcuNSA3LjMgNDIuMy02LjggODUuNS0zNy41IDExNS41LTc3LjMgNzUuNS0zNC42IDIwNyA3Mi40IDIyMi41eiIgZmlsbD0iIzIzMTgxNSIgb3BhY2l0eT0iLjMiIHAtaWQ9IjMxOTciPjwvcGF0aD48cGF0aCBkPSJNMjY2LjkgNzE4LjFjNDIuNSA2LjIgNzkuMiAzMi45IDk4LjIgNzEuNCA0Ny44IDk2LjkgMTg2LjEgOTYuOSAyMzMuOSAwIDE5LTM4LjUgNTUuNy02NS4yIDk4LjItNzEuNCAxMDctMTUuNSAxNDkuNy0xNDcgNzIuMy0yMjIuNS0zMC43LTMwLTQ0LjgtNzMuMS0zNy41LTExNS41IDE4LjMtMTA2LjYtOTMuNi0xODcuOC0xODkuMy0xMzcuNS0zOCAyMC04My40IDIwLTEyMS40IDAtOTUuNy01MC4zLTIwNy41IDMwLjktMTg5LjMgMTM3LjUgNy4zIDQyLjMtNi44IDg1LjUtMzcuNSAxMTUuNS03Ny4zIDc1LjUtMzQuNSAyMDcgNzIuNCAyMjIuNXoiIGZpbGw9IiNDRTAwMDAiIHAtaWQ9IjMxOTgiPjwvcGF0aD48cGF0aCBkPSJNNjgzLjIgMzg4LjZjLTM3LjYtNS41LTcwLjItMjkuMS04Ny02My4yLTQyLjQtODUuOS0xNjQuOC04NS45LTIwNy4yIDAtMTYuOCAzNC4xLTQ5LjQgNTcuNy04NyA2My4yLTk0LjggMTMuOC0xMzIuNiAxMzAuMi02NCAxOTcuMSAyNy4yIDI2LjUgMzkuNyA2NC44IDMzLjIgMTAyLjNDMjU1IDc4Mi4zIDM1NCA4NTQuMyA0MzguOCA4MDkuN2MzMy43LTE3LjcgNzMuOS0xNy43IDEwNy41IDAgODQuOCA0NC42IDE4My44LTI3LjQgMTY3LjYtMTIxLjgtNi40LTM3LjUgNi03NS43IDMzLjItMTAyLjMgNjguNy02Ni44IDMwLjgtMTgzLjMtNjMuOS0xOTd6IiBmaWxsPSIjMjMxODE1IiBvcGFjaXR5PSIuMyIgcC1pZD0iMzE5OSI+PC9wYXRoPjxwYXRoIGQ9Ik02NzIuNyAzNzBjLTM3LjYtNS41LTcwLjItMjkuMS04Ny02My4yLTQyLjQtODUuOS0xNjQuOC04NS45LTIwNy4yIDAtMTYuOCAzNC4xLTQ5LjQgNTcuNy04NyA2My4yLTk0LjggMTMuOC0xMzIuNiAxMzAuMi02NCAxOTcuMSAyNy4yIDI2LjUgMzkuNyA2NC44IDMzLjIgMTAyLjMtMTYuMiA5NC40IDgyLjkgMTY2LjQgMTY3LjYgMTIxLjggMzMuNy0xNy43IDczLjktMTcuNyAxMDcuNSAwIDg0LjggNDQuNiAxODMuOC0yNy40IDE2Ny42LTEyMS44LTYuNC0zNy41IDYtNzUuNyAzMy4yLTEwMi4zIDY4LjctNjYuOSAzMC45LTE4My40LTYzLjktMTk3LjF6IiBmaWxsPSIjRkYwMzAzIiBwLWlkPSIzMjAwIj48L3BhdGg+PHBhdGggZD0iTTMzNS45IDY5MS42YzMyIDQuNyA1OS43IDI0LjggNzQuMSA1My44IDM2LjEgNzMuMSAxNDAuMyA3My4xIDE3Ni40IDAgMTQuMy0yOSA0Mi00OS4yIDc0LjEtNTMuOCA4MC43LTExLjcgMTEyLjktMTEwLjkgNTQuNS0xNjcuOC0yMy4yLTIyLjYtMzMuOC01NS4yLTI4LjMtODcuMUM3MDAuNSAzNTYuMyA2MTYuMSAyOTUuMSA1NDQgMzMzYy0yOC43IDE1LjEtNjIuOSAxNS4xLTkxLjUgMC03Mi4yLTM3LjktMTU2LjUgMjMuMy0xNDIuNyAxMDMuNyA1LjUgMzEuOS01LjEgNjQuNS0yOC4zIDg3LjEtNTguNSA1Ni45LTI2LjIgMTU2LjEgNTQuNCAxNjcuOHoiIGZpbGw9IiMyMzE4MTUiIG9wYWNpdHk9Ii4zIiBwLWlkPSIzMjAxIj48L3BhdGg+PHBhdGggZD0iTTMxOS45IDY3NS41YzMyIDQuNyA1OS43IDI0LjggNzQuMSA1My44IDM2LjEgNzMuMSAxNDAuMyA3My4xIDE3Ni40IDAgMTQuMy0yOSA0Mi00OS4yIDc0LjEtNTMuOCA4MC43LTExLjcgMTEyLjktMTEwLjkgNTQuNS0xNjcuOC0yMy4yLTIyLjYtMzMuOC01NS4yLTI4LjMtODcuMUM2ODQuNCAzNDAuMyA2MDAuMSAyNzkgNTI3LjkgMzE3Yy0yOC43IDE1LjEtNjIuOSAxNS4xLTkxLjUgMC03Mi4yLTM3LjktMTU2LjUgMjMuMy0xNDIuNyAxMDMuNyA1LjUgMzEuOS01LjEgNjQuNS0yOC4zIDg3LjEtNTguNCA1Ni44LTI2LjIgMTU2IDU0LjUgMTY3Ljd6IiBmaWxsPSIjRkYwMDAwIiBwLWlkPSIzMjAyIj48L3BhdGg+PHBhdGggZD0iTTMxOS45IDY3NS41YzMyIDQuNyA1OS43IDI0LjggNzQuMSA1My44IDM2LjEgNzMuMSAxNDAuMyA3My4xIDE3Ni40IDAgMTQuMy0yOSA0Mi00OS4yIDc0LjEtNTMuOCA4MC43LTExLjcgMTEyLjktMTEwLjkgNTQuNS0xNjcuOC0yMy4yLTIyLjYtMzMuOC01NS4yLTI4LjMtODcuMUM2ODQuNCAzNDAuMyA2MDAuMSAyNzkgNTI3LjkgMzE3Yy0yOC43IDE1LjEtNjIuOSAxNS4xLTkxLjUgMC03Mi4yLTM3LjktMTU2LjUgMjMuMy0xNDIuNyAxMDMuNyA1LjUgMzEuOS01LjEgNjQuNS0yOC4zIDg3LjEtNTguNCA1Ni44LTI2LjIgMTU2IDU0LjUgMTY3Ljd6IiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIuMSIgcC1pZD0iMzIwMyI+PC9wYXRoPjxwYXRoIGQ9Ik00ODIuMSA2NDguNmwtMTYuNS0xMDQuMy0xMDQuMyAxNi41IDk0LTQ4LTQ3LjktOTQgNzQuNyA3NC42IDc0LjctNzQuNi00Ny45IDk0IDk0IDQ4LTEwNC4yLTE2LjV6IiBmaWxsPSIjRkZDNzRBIiBwLWlkPSIzMjA0Ij48L3BhdGg+PHBhdGggZD0iTTQ4Mi4xIDUyMm0tMTggMGExOCAxOCAwIDEgMCAzNiAwIDE4IDE4IDAgMSAwLTM2IDBaIiBmaWxsPSIjRkYwMzAzIiBwLWlkPSIzMjA1Ij48L3BhdGg+PHBhdGggZD0iTTQ4Mi4xIDY0OC42bS0xOCAwYTE4IDE4IDAgMSAwIDM2IDAgMTggMTggMCAxIDAtMzYgMFoiIGZpbGw9IiNGRkM3NEEiIHAtaWQ9IjMyMDYiPjwvcGF0aD48cGF0aCBkPSJNMzYxLjMgNTYwLjNtLTE4IDBhMTggMTggMCAxIDAgMzYgMCAxOCAxOCAwIDEgMC0zNiAwWiIgZmlsbD0iI0ZGQzc0QSIgcC1pZD0iMzIwNyI+PC9wYXRoPjxwYXRoIGQ9Ik02MDIuOSA1NjAuM20tMTggMGExOCAxOCAwIDEgMCAzNiAwIDE4IDE4IDAgMSAwLTM2IDBaIiBmaWxsPSIjRkZDNzRBIiBwLWlkPSIzMjA4Ij48L3BhdGg+PHBhdGggZD0iTTU1Ni4zIDQxOC44bS0xOCAwYTE4IDE4IDAgMSAwIDM2IDAgMTggMTggMCAxIDAtMzYgMFoiIGZpbGw9IiNGRkM3NEEiIHAtaWQ9IjMyMDkiPjwvcGF0aD48cGF0aCBkPSJNNDA3LjcgNDE4LjhtLTE4IDBhMTggMTggMCAxIDAgMzYgMCAxOCAxOCAwIDEgMC0zNiAwWiIgZmlsbD0iI0ZGQzc0QSIgcC1pZD0iMzIxMCI+PC9wYXRoPjwvc3ZnPg==);
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
