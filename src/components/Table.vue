<template>
  <div>
    <table
      ref="table"
      @contextmenu="menuShow"
    >
      <tr v-for="(r,index) in tableData" :key="index">
        <template v-for="(item,tdIndex) in r">
          <td
            v-if="!item.isMerge"
            :key="tdIndex"
            :class="[item.__select ? '__select' : '']"
            :rowspan="item.rowspan"
            :colspan="item.colspan"
            @mousemove="moveAction(item.x,item.y)"
            @mousedown.left="downAction(item.x,item.y)"
            @mousedown.right="downActionOnce(item.x,item.y)"
            @mouseup.left="upAction"
          >
            <input
              type="text"
              :value="'('+item.x+','+item.y+')'"
              @input="inputAction"
            >
          </td>
        </template>
      </tr>
    </table>
    <Menu
      v-show="showMenu"
      ref="menu"
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
// import throttle from 'lodash.throttle'
import Menu from './Menu'
// :value="'('+item.x+','+item.y+')'"
export default {
  name: 'Table',
  components: {
    Menu
  },
  props: {
    rows: {
      type: Number,
      default: 10,
      require: true
    },
    columns: {
      type: Number,
      default: 10,
      require: true
    }
  },
  data() {
    return {
      tableData: [],
      row: this.rows,
      column: this.columns,
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
      showMenu: false,
      beMergeCell: [],
      mergeCell: []
    }
  },
  watch: {
    position: {
      handler(newName, oldName) {
        if (typeof (oldName) === 'undefined') {
          return
        }
        if (!this.mouseFlag) {
          return
        }
        this.tableData = this.makeTableData()
      },
      immediate: true,
      deep: true
    },
    rows: {
      handler(newName, oldName) {
        this.row = this.rows
      },
      immediate: true
    },
    columns: {
      handler(newName, oldName) {
        this.column = this.columns
      },
      immediate: true
    }
  },
  created() {
    this.initTable()
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
      if (!this.$refs.menu.$el.contains(event.target)) {
        this.showMenu = false
      }
      if (
        this.$refs.table.contains(event.target) ||
        this.$refs.menu.$el.contains(event.target)
      ) {
        return ''
      }
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
            __select: false,
            rowspan: 1,
            colspan: 1,
            isMerge: false
          }
          arr.push(obj)
        }
        tableData.push(arr)
      }
      this.tableData = tableData
    },
    /**
     * 点击右键之后直接修改选中区域
     */
    downActionOnce(x, y) {
      // 如果选择的区域不是一个单元格，在其他地方点击右键则不选中
      if (
        this.position.x.from - this.position.x.to !== 0 ||
        this.position.y.from - this.position.y.to !== 0
      ) {
        return
      }
      this.position.x.from = x
      this.position.y.from = y
      this.position.x.to = x
      this.position.y.to = y
    },
    downAction(x, y) {
      this.mouseFlag = true
      this.position.x.from = x
      this.position.y.from = y
      this.position.x.to = x
      this.position.y.to = y
    },
    moveAction(x, y) {
      if (this.mouseFlag) {
        this.position.x.to = parseInt(x)
        this.position.y.to = parseInt(y)
      }
    },
    upAction() {
      this.mouseFlag = false
    },
    insertRow() {
      const { row, column } = this
      const {
        x: { from: xFrom, to: xTo }
      } = this.position
      const maxX = Math.max(xFrom, xTo)
      const newRow = []
      const YY = [] // 插入的新行中包含合并的列
      for (let i = 0; i < this.beMergeCell.length; i++) {
        if (this.beMergeCell[i].x === maxX + 1) {
          YY.push(this.beMergeCell[i].y)
        }
      }
      console.log('TCL: insertRow -> YY', YY)
      let isMerge = false
      for (let col = 0; col < parseInt(column); col++) {
        // 插入位置的列中包含合并，则不显示
        if (YY.indexOf(col) > -1) {
          isMerge = true
          this.beMergeCell.splice(maxX + 1, 0, this.tableData[maxX + 1][col])
          console.log('TCL: insertRow -> this.beMergeCell', this.beMergeCell)
        } else {
          isMerge = false
        }
        const newCell = {
          value: '',
          x: maxX + 1,
          y: col,
          __select: false,
          rowspan: 1,
          colspan: 1,
          isMerge
        }
        newRow.push(newCell)
      }
      this.tableData.splice(maxX + 1, 0, newRow)
      // // 更新合并单元格的rowspan
      if (this.mergeCell.length !== 0) {
        const mergeMinX = this.mergeCell[0].x
        const mergeMaxX = this.beMergeCell.slice(-1)[0].x
        if (maxX >= mergeMinX && maxX <= mergeMaxX) {
          for (let i = 0; i < this.mergeCell.length; i++) {
            const updateMergeX = this.mergeCell[i].x
            const updateMergeY = this.mergeCell[i].y
            this.tableData[updateMergeX][updateMergeY].rowspan += 1
          }
        }
      }
      this.row = row + 1
      this.$emit('updateRow', this.row)
    },
    insertColumn(event) {
      const { row, column } = this
      const { from, to } = this.position.y
      const max = Math.max(from, to)
      for (let r = 0; r < parseInt(row); r++) {
        const newCell = {
          value: '',
          x: r,
          y: max,
          __select: false,
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
      for (let r = 0; r < parseInt(row); r++) {
        for (let col = 0; col < parseInt(column); col++) {
          // 被选中区域
          if (tableData[r][col].__select) {
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
            this.mergeCell.push(tableData[i][j])
          } else {
            tableData[i][j].isMerge = true
            this.beMergeCell.push(tableData[i][j])
          }
          console.log('TCL: mergeTd -> this.mergeCell', this.mergeCell)
          console.log('TCL: mergeTd -> this.beMergeCell', this.beMergeCell)
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
      const { row, column } = this
      for (let r = 0; r < parseInt(row); r++) {
        const arr = []
        for (let col = 0; col < parseInt(column); col++) {
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
          const __select = this.inRange(r, col)
          const obj = {
            value: this.tableData[r][col].value,
            x: r,
            y: col,
            __select,
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
      let containMerge = false

      const maxXStart = xFrom + this.tableData[xFrom][yFrom].rowspan - 1
      const maxYStart = yFrom + this.tableData[xFrom][yFrom].colspan - 1
      const maxXEnd = xTo + this.tableData[xTo][yTo].rowspan - 1
      const maxYEnd = yTo + this.tableData[xTo][yTo].colspan - 1

      const minXX = Math.min(xFrom, xTo)
      const minYY = Math.min(yFrom, yTo)
      const maxXX = Math.max(maxXStart, maxXEnd)
      const maxYY = Math.max(maxYStart, maxYEnd)
      let minXXX = minXX
      let minYYY = minYY
      let maxXXX = maxXX
      let maxYYY = maxYY
      if (this.beMergeCell.length !== 0) {
        for (let i = 0; i < this.beMergeCell.length; i++) {
          const doX = this.beMergeCell[i].x
          const doY = this.beMergeCell[i].y
          if ((doX >= minXX && doX <= maxXX) && (doY >= minYY && doY <= maxYY)) {
            const rowspan = this.mergeCell[0].rowspan
            const colspan = this.mergeCell[0].colspan
            const mergeMinX = this.mergeCell[0].x
            const mergeMinY = this.mergeCell[0].y
            const mergeMaxX = mergeMinX + rowspan - 1
            const mergeMaxY = mergeMinY + colspan - 1
            minXXX = Math.min(minXX, mergeMinX)
            minYYY = Math.min(minYY, mergeMinY)
            maxXXX = Math.max(maxXX, mergeMaxX)
            maxYYY = Math.max(maxYY, mergeMaxY)
            containMerge = true
          }
        // }
        // console.log('TCL: inRange -> minXXX', minXXX)
        // console.log('TCL: inRange -> minYYY', minYYY)
        // console.log('TCL: inRange -> maxXXX', maxXXX)
        // console.log('TCL: inRange -> maxYYY', maxYYY)
        }
      }

      /**
       * 遍历被合并的单元格的XY，如果XY在from，to之间，则说明合并的单元格应该高亮
       * 找到最大最小值，之间的单元格都高亮
       */
      if (containMerge) {
        if ((x >= minXXX && x <= maxXXX) && (y >= minYYY && y <= maxYYY)) {
          return true
        }
      } else {
        if ((x >= minXX && x <= maxXX) && (y >= minYY && y <= maxYY)) {
          return true
        }
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
.__select{
  background:rgba(202,217,234,0.5);
}
</style>
