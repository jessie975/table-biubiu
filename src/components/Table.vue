<template>
  <div>
    <table
      id="table"
      @mousedown.left="downAction"
      @mousedown.right="downActionOnce"
      @mouseup.left="upAction"
      @contextmenu="menuShow"
    >
      <tr v-for="(r,index) in tableData" :key="index">
        <template v-for="(item,tdIndex) in r">
          <td
            v-if="!item.isMerge"
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
              :value="'('+item.x+','+item.y+')'"
              @input="inputAction"
            >
          </td>
        </template>
      </tr>
    </table>
    <Menu
      v-show="showMenu"
      id="menu"
      :top="menuTop"
      :left="menuLeft"
      :show-menu="showMenu"
      @deleteRow="deleteRow"
      @insertColumn="insertColumn"
      @deleteColumn="deleteColumn"
      @insertRow="insertRow"
      @mergeTd="mergeTd"
    />
  </div>
</template>

<script>
import throttle from 'lodash.throttle'
import Menu from './Menu'
// :value="'('+item.x+','+item.y+')'"
export default {
  name: 'Table',
  components: {
    Menu
  },
  data() {
    return {
      tableData: [],
      row: 10,
      column: 10,
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
      menuTop: 0,
      menuLeft: 0,
      showMenu: false
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
      const { clientX, clientY } = event
      this.menuTop = clientY
      this.menuLeft = clientX
      this.showMenu = !this.showMenu
      event.preventDefault()
      return false
    },
    handlerClose(event) {
      if (!document.getElementById('menu').contains(event.target)) {
        this.showMenu = false
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
    updataXY() {
      const { x, y } = event.target.dataset
      this.position.x.from = parseInt(x)
      this.position.y.from = parseInt(y)
      this.position.x.to = parseInt(x)
      this.position.y.to = parseInt(y)
    },
    /**
     * 点击右键之后直接修改选中区域
     */
    downActionOnce(event) {
      // 如果选择的区域不是一个单元格，在其他地方点击右键则不选中
      if (
        this.position.x.from - this.position.x.to !== 0 ||
        this.position.y.from - this.position.y.to !== 0
      ) {
        return
      }
      this.updataXY()
    },
    downAction(event) {
      this.mouseFlag = true
      this.updataXY()
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
    insertRow() {
      const { row, column } = this
      const {
        x: { from: xFrom, to: xTo },
        y: { from: yFrom, to: yTo }
      } = this.position
      const minX = Math.min(xFrom, xTo)
      const maxX = Math.max(xFrom, xTo)
      const newRow = []

      for (let i = minX; i < maxX; i++) {
        for (let col = 0; col < column; col++) {
          if (this.tableData[i][col].rowspan !== 1 || this.tableData[i][col].colspan !== 1) {
            console.log('包含合并')
          }
          const newCell = {
            value: '',
            x: maxX + 1,
            y: col,
            select: false,
            rowspan: 1,
            colspan: 1,
            isMerge: false
          }
          newRow.push(newCell)
        }
      }
      this.tableData.splice(maxX + 1, 0, newRow)
      this.row = row + 1
    },
    insertColumn(event) {
      const { row, column } = this
      const { from, to } = this.position.y
      const max = Math.max(from, to)
      for (let r = 0; r < row; r++) {
        const newCell = {
          value: '',
          x: r,
          y: max,
          select: false,
          rowspan: 1,
          colspan: 1,
          isMerge: false
        }
        this.tableData[r].splice(max + 1, 0, newCell)
      }
      this.column = column + 1
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
      const mergeValue = []
      const { row, column } = this
      const tableData = this.tableData // 不做拷贝, 直接修改this.tableData // 因为修改的是数组的对象, 所以vue也能感知到数据变化
      let minX
      let minY
      let maxX
      let maxY
      for (let r = 0; r < row; r++) {
        for (let col = 0; col < column; col++) {
          // 被选中区域
          if (tableData[r][col].select) {
            if (typeof (minX) === 'undefined') {
              minX = r
            }
            if (typeof (maxX) === 'undefined') {
              maxX = r
            }
            if (typeof (minY) === 'undefined') {
              minY = col
            }
            if (typeof (maxY) === 'undefined') {
              maxY = col
            }
            minX = minX > r ? r : minX
            minY = minY > col ? col : minY
            maxX = maxX > r ? maxX : r
            maxY = maxY > col ? maxY : col
          }
        }
      }

      for (let i = minX; i <= maxX; i++) {
        for (let j = minY; j <= maxY; j++) {
          if (i === minX && j === minY) {
            tableData[i][j].rowspan = Math.abs(maxX - minX) + 1
            tableData[i][j].colspan = Math.abs(maxY - minY) + 1
          } else {
            tableData[i][j].isMerge = true
          }
          mergeValue.push(tableData[i][j].value)
        }
      }
      this.tableData[minX][minY].value = String(mergeValue)
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
      for (let r = 0; r < row; r++) {
        const arr = []
        const column = tableData[r].length
        for (let col = 0; col < column; col++) {
          let rowspanDefault = 1
          let colspanDefault = 1
          let isMerge = false
          if (tableData[r][col].colspan !== 1 || tableData[r][col].rowspan !== 1) {
            rowspanDefault = tableData[r][col].rowspan
            colspanDefault = tableData[r][col].colspan
          }
          if (tableData[r][col].isMerge) {
            isMerge = true
          }
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
       * 选中的单元格中包含合并后的单元格的选中区域
       */
      const minX = Math.min(xFrom, xTo)
      const minY = Math.min(yFrom, yTo)
      const maxX = Math.max(xFrom, xTo)
      const maxY = Math.max(yFrom, yTo)
      for (let r = minX; r <= maxX; r++) {
        for (let col = minY; col <= maxY; col++) {
          if (this.tableData[r][col].colspan !== 1 || this.tableData[r][col].rowspan !== 1) {
            // console.log('包含合并')
            const colspan = this.tableData[r][col].colspan
            const rowspan = this.tableData[r][col].rowspan
            if (xFrom === r && yFrom === col) {
              console.log('起点是合并单元格')
              /**
               * 右下到左上
               */
              if ((x >= xTo && x <= xFrom + rowspan - 1) && (y >= yTo && y <= yFrom + colspan - 1)) {
                return true
              }
              /**
               * 右上到左下
               */
              if ((x >= xFrom && x <= xTo) && (y >= yTo && y <= yFrom + colspan - 1)) {
                return true
              }
              /**
               * 左下到右上
               */
              if ((x >= xTo && x <= xFrom + rowspan - 1) && (y >= yFrom && y <= yTo)) {
                return true
              }
            } else {
              /**
             * 左上到右下
             */
              if ((x >= xFrom && x <= xTo + rowspan - 1) && (y >= yFrom && y <= yTo + colspan - 1)) {
                this.direction1 = true
                return true
              }
              /**
             * 左下到右上
             */
              if ((x <= xFrom && x >= xTo) && (y >= yFrom && y <= yTo + colspan - 1)) {
                this.direction4 = true
                return true
              }
              /**
             * 右上 到 左下
             */
              if ((x >= xFrom && x <= xTo + rowspan - 1) && (y <= yFrom && y >= yTo)) {
                this.direction2 = true
                return true
              }
            }
          }
        }
      }
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
        this.direction3 = true
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
    }
  }
}
</script>

<style scoped>
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
