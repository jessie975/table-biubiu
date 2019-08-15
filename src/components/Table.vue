<template>
  <div>
    <table ref="table">
      <tr v-for="(r,index) in tableData" :key="index">
        <template v-for="(item,tdIndex) in r">
          <td
            v-if="!item.isMerge"
            :key="tdIndex"
            :class="[item.__select ? 'select' : '']"
            :rowspan="item.rowspan"
            :colspan="item.colspan"
            @mousemove="moveAction(item.x,item.y)"
            @mousedown.left="downAction(item.x,item.y)"
            @mousedown.right="downActionOnOneTd(item.x,item.y)"
            @mouseup.left="upAction"
            @contextmenu="menuShow"
          >
            <input
              type="text"
              :value="'('+item.x+','+item.y+')'"
              @input="inputAction"
            >
            {{/* :value="'('+item.x+','+item.y+')'" */}}
          </td>
        </template>
      </tr>
    </table>
    <Menu
      v-show="isShowMenu"
      ref="menu"
      :top="menuTop"
      :left="menuLeft"
      :show-menu="isShowMenu"
      @deleteRow="deleteRow"
      @insertColumn="insertColumn"
      @deleteColumn="deleteColumn"
      @insertRow="insertRow"
      @mergeTd="mergeTd"
    />
  </div>
</template>

<script>
import lodash from 'lodash'
import Menu from './Menu'

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
      isMouse: false,
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
      isShowMenu: false,
      /**
       * 被合并了的单元格
       */
      beMergeCell: [],
      mergeCell: []
    }
  },
  watch: {
    position: {
      handler(newName, oldName) {
        if (typeof oldName === 'undefined') {
          return
        }
        this.tableData = this.makeTableData()
      },
      immediate: true,
      deep: true
    },
    rows() {
      this.row = this.rows
    },
    columns() {
      this.column = this.columns
    }
  },
  // created() {
  //   this.initTable()
  // },
  mounted() {
    document.addEventListener('click', this.handlerClose)
  },
  destroyed() {
    document.removeEventListener('click', this.handlerClose)
  },
  methods: {
    menuShow(event) {
      event.preventDefault()
      const { clientX, clientY } = event
      this.menuTop = clientY
      this.menuLeft = clientX
      this.isShowMenu = true
    },
    handlerClose(event) {
      if (!this.$refs.menu.$el.contains(event.target)) {
        this.isShowMenu = false
      }
    },
    /**
     * 初始化表格
     */
    initTable() {
      const { row, column } = this
      const tableData = []
      for (let r = 0; r < row; r++) {
        const arr = []
        for (let col = 0; col < column; col++) {
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
     * 更新坐标
     */
    positionXY(x, y) {
      this.position.x.from = x
      this.position.y.from = y
      this.position.x.to = x
      this.position.y.to = y
    },
    /**
     * 如果选择的区域不是一个单元格，点击右键则弹出菜单，如果是一个单元格则选中区域替换为右键点击的单元格消失
     */
    downActionOnOneTd(x, y) {
      const {
        x: { from: xFrom, to: xTo },
        y: { from: yFrom, to: yTo }
      } = this.position
      if (xFrom - xTo !== 0 || yFrom - yTo !== 0) { return }
      this.positionXY(x, y)
    },
    downAction(x, y) {
      this.isMouse = true
      this.positionXY(x, y)
    },
    moveAction(x, y) {
      if (this.isMouse) {
        this.position.x.to = x
        this.position.y.to = y
      }
    },
    upAction() {
      this.isMouse = false
    },
    /**
     * 更新合并单元格的rowspan或者colspan
     */
    updateMergeCellOfColspanOrRowspan(max, kindSpan) {
      if (this.mergeCell.length !== 0) {
        // FIXME:未处理多个合并单元格情况
        const mergeMinX = this.mergeCell[0].x
        const mergeMaxX = this.beMergeCell.slice(-1)[0].x
        if (max >= mergeMinX && max <= mergeMaxX) {
          for (let i = 0; i < this.mergeCell.length; i++) {
            const updateMergeX = this.mergeCell[i].x
            const updateMergeY = this.mergeCell[i].y
            debugger
            if (kindSpan) {
              this.tableData[updateMergeX][updateMergeY].rowspan += 1
            } else {
              this.tableData[updateMergeX][updateMergeY].colspan += 1
            }
          }
        }
      }
    },
    insertRow() {
      const {
        position:
        { x: { from, to }},
        column,
        tableData,
        beMergeCell
      } = this
      const maxX = Math.max(from, to)
      const newRow = []
      const isRowspan = true
      let isMerge = false
      // 插入的新行中包含被合并的列数组：shouldDeleteX
      const shouldDeleteY = []
      for (let i = 0; i < beMergeCell.length; i++) {
        if (beMergeCell[i].x === maxX + 1) {
          shouldDeleteY.push(beMergeCell[i].y)
        }
      }
      for (let col = 0; col < column; col++) {
        // 插入位置的列中包含合并，则不显示
        if (shouldDeleteY.includes(col)) {
          // mdn Array.includes;
          isMerge = true
          beMergeCell.splice(maxX, 0, tableData[maxX + 2][col])
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
      tableData.splice(maxX + 1, 0, newRow)
      // 更新合并单元格的rowspan
      this.updateMergeCellOfColspanOrRowspan(maxX, isRowspan)
      this.row += 1
      this.$emit('insertRow', this.row)
    },
    insertColumn() {
      const {
        position:
        { y: { from, to }},
        row,
        beMergeCell,
        tableData
      } = this
      const maxY = Math.max(from, to)
      const isRowspan = false
      // 插入的新列中包含被合并的行数组：shouldDeleteX
      const shouldDeleteX = []
      for (let i = 0; i < beMergeCell.length; i++) {
        if (beMergeCell[i].y === maxY + 1) {
          shouldDeleteX.push(beMergeCell[i].x)
        }
      }
      let isMerge = false
      for (let r = 0; r < row; r++) {
        // 插入位置的列中包含合并，则不显示
        if (shouldDeleteX.includes(r)) {
          // mdn Array.includes;
          isMerge = true
          beMergeCell.splice(maxY, 0, tableData[maxY][r + 2])
        } else {
          isMerge = false
        }
        const newCell = {
          value: '',
          x: r,
          y: maxY + 1,
          __select: false,
          rowspan: 1,
          colspan: 1,
          isMerge
        }
        tableData[r].splice(maxY + 1, 0, newCell)
      }
      // 更新合并单元格的colspan
      this.updateMergeCellOfColspanOrRowspan(maxY, isRowspan)
      this.column += 1
      this.$emit('insertColumn', this.column)
    },
    deleteRow() {
      const { from, to } = this.position.x
      this.tableData.splice(Math.min(from, to), Math.abs(to - from) + 1)
      this.row = this.row - (Math.abs(to - from) + 1)
      this.$emit('deleteRow', this.row)
    },
    deleteColumn() {
      const { from, to } = this.position.y
      this.column = this.column - (Math.abs(to - from) + 1)
      this.tableData.forEach((arr, index) => {
        arr.splice(Math.min(from, to), Math.abs(to - from) + 1)
      })
      this.$emit('deleteColumn', this.column)
    },
    mergeTd() {
      const mergeValue = []
      const { row, column } = this
      /**
       * 不做拷贝, 直接修改this.tableData
       * 因为修改的是数组的对象, 所以vue也能感知到数据变化
       */
      const tableData = this.tableData
      let minX, minY, maxX, maxY
      for (let r = 0; r < parseInt(row); r++) {
        for (let col = 0; col < parseInt(column); col++) {
          // 被选中区域
          if (tableData[r][col].__select) {
            if (typeof minX === 'undefined') { minX = r }
            if (typeof maxX === 'undefined') { maxX = r }
            if (typeof minY === 'undefined') { minY = col }
            if (typeof maxY === 'undefined') { maxY = col }
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
      for (let r = 0; r < row; r++) {
        const arr = []
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
    repeal() {
      // const newState = lodash.cloneDeep(this.tableData)
      // return newState
    },
    inRange(x, y) {
      const {
        x: { from: xFrom, to: xTo },
        y: { from: yFrom, to: yTo }
      } = this.position

      const maxXStart = xFrom + this.tableData[xFrom][yFrom].rowspan - 1
      const maxYStart = yFrom + this.tableData[xFrom][yFrom].colspan - 1
      const maxXEnd = xTo + this.tableData[xTo][yTo].rowspan - 1
      const maxYEnd = yTo + this.tableData[xTo][yTo].colspan - 1

      const minSelectX = Math.min(xFrom, xTo)
      const minSelectY = Math.min(yFrom, yTo)
      const maxSelectX = Math.max(maxXStart, maxXEnd)
      const maxSelectY = Math.max(maxYStart, maxYEnd)

      const arrayMinX = []
      const arrayMaxX = []
      const arrayMinY = []
      const arrayMaxY = []

      arrayMinX.push(minSelectX)
      arrayMaxX.push(maxSelectX)
      arrayMinY.push(minSelectY)
      arrayMaxY.push(maxSelectY)

      /**
         * 遍历被合并的单元格的XY，如果XY在from，to之间，则说明合并的单元格应该高亮
         * 找到最大最小值，之间的单元格都高亮
         */
      if (this.tableData[xFrom][yFrom].rowspan === 1 || this.tableData[xFrom][yFrom].colspan === 1) {
        for (let i = 0; i < this.beMergeCell.length; i++) {
          const passX = this.beMergeCell[i].x
          const passY = this.beMergeCell[i].y
          if ((passX >= minSelectX && passX <= maxSelectX) && (passY >= minSelectY && passY <= maxSelectY)) {
            for (let j = 0; j < this.mergeCell.length; j++) {
              const rowspan = this.mergeCell[j].rowspan
              const colspan = this.mergeCell[j].colspan
              const mergeMinX = this.mergeCell[j].x
              const mergeMinY = this.mergeCell[j].y
              const mergeMaxX = mergeMinX + rowspan - 1
              const mergeMaxY = mergeMinY + colspan - 1
              // if ((passX >= mergeMinX && passX <= mergeMaxX) && (passY >= mergeMinY && passY <= mergeMaxY)) {
              arrayMinX.push(mergeMinX)
              arrayMaxX.push(mergeMaxX)
              arrayMinY.push(mergeMinY)
              arrayMaxY.push(mergeMaxY)
              // }
            }
          }
        }
      }
      const minXXX = Math.min(...new Set(arrayMinX))
      const maxXXX = Math.max(...new Set(arrayMaxX))
      const minYYY = Math.min(...new Set(arrayMinY))
      const maxYYY = Math.max(...new Set(arrayMaxY))
      console.log('TCL: inRange -> minXXX', minXXX)
      console.log('TCL: inRange -> maxXXX', maxXXX)
      console.log('TCL: inRange -> minYYY', minYYY)
      console.log('TCL: inRange -> maxYYY', maxYYY)

      if ((x >= minXXX && x <= maxXXX) && (y >= minYYY && y <= maxYYY)) {
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
  overflow: hidden;
}
table td {
  padding: 0 5px;
  width: 100px;
  box-sizing: border-box;
  user-select: none;
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
