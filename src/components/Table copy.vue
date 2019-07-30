<template>
  <div>
    <div @click="clickBtn">
      <button data-type="InsertRow">插入行</button>
      <button data-type="InsertColumn">插入列</button>
      <button data-type="deleteRow">删除行</button>
      <button data-type="deleteColumn">删除列</button>
    </div>
    <table
      id="table"
      @mousedown.left="downAction"
      @mousedown.right="downActionOnece"
      @mouseup.left="upAction"
      @mouseleave="upAction"
      @contextmenu="menuShow"
    >
      <tr v-for="(r,index) in tableData" :key="index">
        <td
          v-for="(item,tdIndex) in r"
          v-show="!item.isMerge"
          :key="tdIndex"
          :data-x="item.x"
          :data-y="item.y"
          :class="[item.select ? 'select' : '']"
          :rowspan="item.rowspan"
          :colspan="item.colspan"
          @mousemove="moveAction"
        >
          <input
            type="text"
            :data-x="item.x"
            :data-y="item.y"
            :value="item.value"
            @input="inputAction"
          >
        </td>
      </tr>
    </table>
    <Menu
      id="menu"
      :top="menuTop"
      :left="menuLeft"
      @deleteRow="deleteRow"
      @InsertColumn="InsertColumn"
      @deleteColumn="deleteColumn"
      @InsertRow="InsertRow"
      @mergeTd="mergeTd"
    />
  </div>
</template>

<script>
import throttle from 'lodash.throttle'
import Menu from './Menu'

export default {
  name: 'Table',
  components: {
    Menu
  },
  data() {
    return {
      tableData: [], // colspan rowspan value x y // onmousedown onmousemove onmouseup
      row: '5',
      column: '8',
      mouseFlag: false,
      /**
       * 选中的坐标
       */
      position: {
        x: {
          from: -1,
          to: -1
        },
        y: {
          from: -1,
          to: -1
        }
      },
      menuTop: -800,
      menuLeft: -800
    }
  },
  watch: {
    position: {
      handler: function(newName, oldName) {
        if (typeof (oldName) === 'undefined') {
          return
        }
        this.tableData = this.makeTableData()
      },
      immediate: true,
      deep: true
    }
  },
  created() {
    this.tableData = this.initTable()
  },
  mounted() {
    document.addEventListener('click', this.handlerClose)
  },
  destroyed() {
    document.removeEventListener('click', this.handlerClose)
  },
  methods: {
    menuShow(event) {
      this.menuTop = event.clientY
      this.menuLeft = event.clientX
      event.preventDefault()
      return false
    },
    handlerClose(event) {
      if (!document.getElementById('menu').contains(event.target)) {
        this.menuTop = -800
        this.menuLeft = -800
      }
      if (
        document.getElementById('table').contains(event.target) ||
        document.getElementById('menu').contains(event.target)
      ) {
        return ''
      }
      this.position.x.from = -1
      this.position.y.from = -1
      this.position.x.to = -1
      this.position.y.to = -1
    },
    /**
     * 初始化表格
     */
    initTable() {
      const { row, column } = this
      const tableData = []
      for (let r = 0; r < parseInt(row); r++) {
        const arr = []
        for (let col = 0; col < parseInt(column); col++) {
          const obj = {
            value: `(${r},${col})`,
            x: r,
            y: col,
            select: false,
            rowspan: 1,
            colspan: 1,
            isMerge: false
          }
          arr.push(obj)
        }
        tableData.push(arr)
      }
      return tableData
    },
    /**
     * 点击右键之后直接修改选中区域
     */
    downActionOnece(event) {
      // 如果选择的区域不是一块
      if (
        this.position.x.from - this.position.x.to !== 0 ||
        this.position.y.from - this.position.y.to !== 0
      ) {
        return
      }
      this.position.x.from = parseInt(event.target.dataset.x)
      this.position.y.from = parseInt(event.target.dataset.y)
      this.position.x.to = parseInt(event.target.dataset.x)
      this.position.y.to = parseInt(event.target.dataset.y)
    },
    downAction(event) {
      this.mouseFlag = true
      const { x, y } = event.target.dataset
      this.position.x.from = parseInt(x)
      this.position.y.from = parseInt(y)
      this.position.x.to = parseInt(x)
      this.position.y.to = parseInt(y)
    },
    moveAction: throttle(function(event) {
      if (this.mouseFlag) {
        const { x, y } = event.target.dataset
        this.position.x.to = parseInt(x)
        this.position.y.to = parseInt(y)
      }
    }, 100),
    upAction() {
      this.mouseFlag = false
    },
    InsertRow() {
      const { from, to } = this.position.x
      const max = Math.max(from, to)
      const tableData = []
      for (let r = 0; r <= max + 1; r++) {
        const arr = []
        const column = this.tableData[r].length
        for (let col = 0; col < parseInt(column); col++) {
          const select = this.inRange(r, col)
          let value = ''
          if (r === max + 1) {
            value = ''
          } else {
            value = this.tableData[r][col].value
          }
          const obj = {
            value,
            x: r,
            y: col,
            select,
            rowspan: 1,
            colspan: 1
          }
          arr.push(obj)
        }
        tableData[r] = arr
      }
      const backArr = this.tableData.slice(max + 1)
      this.tableData = tableData.concat(backArr)
      this.row = parseInt(this.row) + 1
    },
    InsertColumn(event) {
      const { row, column } = this
      const { from, to } = this.position.y
      const max = Math.max(from, to)
      const tableData = []
      for (let r = 0; r < row; r++) {
        const arr = []
        const column = this.tableData[r].length
        for (let col = 0; col < parseInt(column) + 1; col++) {
          const select = this.inRange(r, col)
          let value = ''
          if (col === max + 1) {
            // 最新插入的列
            value = ''
          } else {
            if (col <= max) {
              // 插入列所在的前面的列
              value = this.tableData[r][col].value
            } else {
              value = this.tableData[r][col - 1].value
            }
          }
          const obj = {
            value,
            x: r,
            y: col,
            select,
            rowspan: 1,
            colspan: 1
          }
          arr.push(obj)
        }
        tableData[r] = arr
      }
      this.tableData = tableData
      this.column = parseInt(column) + 1
    },
    deleteRow() {
      const { from, to } = this.position.x
      this.tableData.splice(Math.min(from, to), Math.abs(to - from) + 1)
      this.row = this.row - (Math.abs(to - from) + 1)
    },
    deleteColumn() {
      const { from, to } = this.position.y
      this.column = this.column - (Math.abs(to - from) + 1)
      this.tableData.forEach((arr, index) => {
        arr.splice(Math.min(from, to), Math.abs(to - from) + 1)
      })
    },
    mergeTd() {
      const { from: fromY, to: toY } = this.position.y
      const { from: fromX, to: toX } = this.position.x
      const minY = Math.min(fromY, toY)
      const minX = Math.min(fromX, toX)
      const rowspan = Math.abs(fromX - toX) + 1
      const colspan = Math.abs(fromY - toY) + 1

      const { row, column } = this
      const tableData = this.tableData // 不做拷贝, 直接修改this.tableData // 因为修改的是数组的对象, 所以vue也能感知到数据变化
      for (let r = 0; r < parseInt(row); r++) {
        for (let col = 0; col < parseInt(column); col++) {
          // 被选中区域
          if (tableData[r][col].select) {
            if (r === minX && col === minY) {
              tableData[r][col].rowspan = rowspan
              tableData[r][col].colspan = colspan
            } else {
              tableData[r][col].isMerge = true
            }
          }
        }
      }
    },
    /**
     * 输入完成
     */
    inputAction(event) {
      const {
        dataset: { x, y },
        value
      } = event.target
      this.tableData[x][y].value = value
    },
    /**
     * 选中区域的数组重新生成
     */
    makeTableData() {
      const tableData = [...this.tableData]
      const row = tableData.length

      let rowHasMerge = false
      let rowspanBack = 1
      let colspanBack = 1
      let xBack = 1
      let yBack = 1
      for (let r = 0; r < parseInt(row); r++) {
        const arr = []
        const column = tableData[r].length
        for (let col = 0; col < parseInt(column); col++) {
          let rowspanDefault = 1
          let colspanDefault = 1
          let isMerge = false
          if (tableData[r][col].colspan !== 1 || tableData[r][col].rowspan !== 1) {
            rowspanDefault = tableData[r][col].rowspan
            colspanDefault = tableData[r][col].colspan
            rowspanBack = tableData[r][col].rowspan
            colspanBack = tableData[r][col].colspan
            xBack = r
            yBack = col
            rowHasMerge = true
          }
          /**
           * 和 合并 的行在同一行
           */
          if (rowHasMerge && col > yBack && col < yBack + colspanBack) {
            isMerge = true
          }
          /**
           * 当前行为合并的行下面占据了一部分单元格的行
           * 1. 存在合并单元格 rowHasMerge
           * 2. 当前的行在被合并的单元格的下面的行（r > xBack）且 当前行在 xBack+rowspanBack
           */
          // if (rowHasMerge && r > xBack && r < xBack + rowspanBack) {
          //   if (col > yBack && col <= yBack + colspanBack) {
          //     isMerge = true
          //   }
          // }
          const select = this.inRange(r, col)
          const obj = {
            value: this.tableData[r][col].value,
            x: r,
            y: col,
            select,
            rowspan: rowspanDefault,
            colspan: colspanDefault,
            isMerge
          }
          arr.push(obj)
        }
        tableData[r] = arr
      }
      return tableData
    },
    inRange(x, y) {
      const {
        x: { from: xFrom, to: xTo },
        y: { from: yFrom, to: yTo }
      } = this.position
      /**
       * 左上到右下
       */
      if (x >= xFrom && x <= xTo && (y >= yFrom && y <= yTo)) {
        return true
      }
      /**
       * 右下到左上
       */
      if (x <= xFrom && x >= xTo && (y <= yFrom && y >= yTo)) {
        return true
      }
      /**
       * 左下到右上
       */
      if (x <= xFrom && x >= xTo && (y >= yFrom && y <= yTo)) {
        return true
      }
      /**
       * 右上 到 左下
       */
      if (x >= xFrom && x <= xTo && (y <= yFrom && y >= yTo)) {
        return true
      }
      return false
    },
    clickBtn(event) {
      if (event.target.dataset.type === 'deleteRow') {
        this.deleteRow()
      } else if (event.target.dataset.type === 'InsertColumn') {
        this.InsertColumn()
      } else if (event.target.dataset.type === 'deleteColumn') {
        this.deleteColumn()
      } else if (event.target.dataset.type === 'InsertRow') {
        this.InsertRow()
      } else {
        return
      }
    }
  }
}
</script>

<style scoped>
button {
  border: 2px #ccc solid;
  background-color: #fff;
  color: #999;
  border-radius: 5px;
  cursor: pointer;
  margin:20px 20px 50px 0;
  padding: 5px 10px;
  outline: none;
}

button:hover {
  color: #fff;
  background-color: rgba(202, 217, 234);
  border: 2px #ccc solid;
}
.create {
  margin-bottom: 50px;
}
table {
  border-collapse: collapse;
  margin: 0 auto;
  text-align: center;
}
table:active,table:hover{
  border: 1px solid #ccc;
}
table td,
table tr {
  border: 1px solid #ccc;
  color: #666;
  height: 30px;
  user-select: none;
  overflow: hidden;
}
table td {
  padding: 0 5px;
  width: 100px;
  box-sizing: border-box;
}
table td input{
  outline: none;
  border: 0;
  width: 100%;
  background: transparent;
  box-sizing: border-box;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  height: 100%;
}
table td:hover{
  box-shadow: 0px 0px 10px 1px rgba(164, 232, 227, 0.2);
}
.select{
  background:rgba(202,217,234,0.5);
}
</style>

