<template>
  <div>
    <table ref="table">
      <tr v-for="(r,index) in tableData" :key="index">
        <template v-for="(item,tdIndex) in r">
          <td
            v-if="!item.isMerge"
            :key="tdIndex"
            :class="[item.isSelect ? 'select' : '']"
            :rowspan="item.rowspan"
            :colspan="item.colspan"
            @mousemove="moveAction(item.x,item.y)"
            @mousedown.left="downAction(item.x,item.y)"
            @mousedown.right="downActionOnOneTd(item.x,item.y)"
            @mouseup.left="upAction"
            @contextmenu="menuShow"
          >
            <!-- <input type="text" :value="value" @input="$emit('input', $event.target.value)"> -->
            <!-- <div class="cell" contenteditable="true" /> -->
            <!-- <slot /> -->
            {{ '('+item.x+','+item.y+')' }}
            <!--{{ :value="'('+item.x+','+item.y+')'" }}-->
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
import Menu from './Menu'

export default {
  name: 'Table',
  components: {
    Menu
  },
  model: {
    prop: 'value',
    event: 'input'
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
    },
    value: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      tableData: [],
      localRow: this.rows,
      localColumn: this.columns,
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
  computed: {
  },
  watch: {
    position: {
      handler(newName, oldName) {
        if (typeof oldName === 'undefined') {
          return
        }
        if (newName.x.from === -1 && oldName.x.from !== -1) {
          return
        }
        this.tableData = this.makeTableData()
      },
      immediate: true,
      deep: true
    },
    rows() {
      this.localRow = this.rows
      // localRow
    },
    columns() {
      this.localColumn = this.columns
    }
  },
  created() {
    this.initTable()
  },
  mounted() {
    document.addEventListener('click', this.menuClose)
  },
  destroyed() {
    document.removeEventListener('click', this.menuClose)
  },
  methods: {
    menuShow(event) {
      event.preventDefault()
      const { clientX, clientY } = event
      this.menuTop = clientY
      this.menuLeft = clientX
      this.isShowMenu = true
    },
    menuClose(event) {
      if (!this.$refs.menu.$el.contains(event.target)) {
        this.isShowMenu = false
      }
    },
    /**
     * 初始化表格
     */
    initTable() {
      const { localRow, localColumn } = this
      const tableData = []
      for (let r = 0; r < localRow; r++) {
        const arr = []
        for (let col = 0; col < localColumn; col++) {
          const obj = {
            value: `(${r},${col})`,
            x: r,
            y: col,
            isSelect: false,
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
    // 更新被合并的单元格
    updateBeMergeCell() {
      this.beMergeCell.length = 0
      for (let i = 0; i < this.localRow; i++) {
        for (let j = 0; j < this.localColumn; j++) {
          if (this.tableData[i][j].isMerge) {
            this.beMergeCell.push(this.tableData[i][j])
          }
        }
      }
    },
    insertRow() {
      const {
        position:
        { x: { from, to }},
        localColumn,
        tableData,
        beMergeCell,
        mergeCell
      } = this
      const maxX = Math.max(from, to)
      const newRow = []
      let shouldDeleteY = []
      let isMerge = false
      for (let i = 0; i < mergeCell.length; i++) {
        const minXOfmergeCell = mergeCell[i].x
        const minYOfmergeCell = mergeCell[i].y
        const maxXOfmergeCell = mergeCell[i].x + mergeCell[i].rowspan - 1
        // 更新插入后合并单元格和被合并单元格的横坐标
        if (minXOfmergeCell >= maxX + 1) {
          mergeCell[i].x += 1
          for (let j = 0; j < beMergeCell.length; j++) {
            beMergeCell[j].x += 1
          }
        }
        if (maxX + 1 >= minXOfmergeCell && maxX + 1 <= maxXOfmergeCell) {
          // 找到插入后应该被删掉的y坐标
          for (let j = 0; j < beMergeCell.length; j++) {
            if (beMergeCell[j].x === maxX + 1) {
              shouldDeleteY.push(beMergeCell[j].y)
            }
          }
          // 更改合并单元格最左上角的rowspan
          if (minXOfmergeCell <= maxX) {
            mergeCell[i].rowspan += 1
            tableData[minXOfmergeCell][minYOfmergeCell].rowspan += 1
          }
        }
      }
      shouldDeleteY = [...new Set(shouldDeleteY)]
      for (let col = 0; col <= localColumn; col++) {
        // 插入位置的列中包含合并，则不显示
        if (shouldDeleteY.includes(col)) {
          isMerge = true
        } else {
          isMerge = false
        }
        const newCell = {
          value: '',
          x: maxX + 1,
          y: col,
          isSelect: false,
          rowspan: 1,
          colspan: 1,
          isMerge
        }
        newRow.push(newCell)
      }
      tableData.splice(maxX + 1, 0, newRow)
      this.localRow += 1
      this.tableData = this.makeTableData()
      this.updateBeMergeCell()
    },
    insertColumn() {
      const {
        position:
        { y: { from, to }},
        localRow,
        tableData,
        beMergeCell,
        mergeCell
      } = this
      const maxY = Math.max(from, to)
      let shouldDeleteX = []
      let isMerge = false
      for (let i = 0; i < mergeCell.length; i++) {
        const minXOfmergeCell = mergeCell[i].x
        const minYOfmergeCell = mergeCell[i].y
        const maxYOfmergeCell = mergeCell[i].y + mergeCell[i].colspan - 1
        // // 更新插入后合并单元格和被合并单元格的纵坐标
        // if (minYOfmergeCell >= maxY + 1) {
        //   mergeCell[i].y += 1
        //   for (let j = 0; j < beMergeCell.length; j++) {
        //     beMergeCell[j].y += 1
        //   }
        // }
        if (maxY + 1 >= minYOfmergeCell && maxY + 1 <= maxYOfmergeCell) {
          // 找到插入后应该被删掉的x坐标
          for (let j = 0; j < beMergeCell.length; j++) {
            if (beMergeCell[j].y === maxY + 1) {
              shouldDeleteX.push(beMergeCell[j].x)
            }
          }
          // 更改合并单元格最左上角的colspan
          if (minYOfmergeCell <= maxY) {
            mergeCell[i].colspan += 1
            tableData[minXOfmergeCell][minYOfmergeCell].colspan += 1
          }
        }
      }
      shouldDeleteX = [...new Set(shouldDeleteX)]
      console.log(shouldDeleteX)
      for (let r = 0; r < localRow; r++) {
        // 插入位置的列中包含合并，则不显示
        if (shouldDeleteX.includes(r)) {
          isMerge = true
        } else {
          isMerge = false
        }
        const newCell = {
          value: '',
          x: r,
          y: maxY + 1,
          isSelect: false,
          rowspan: 1,
          colspan: 1,
          isMerge
        }
        tableData[r].push(newCell)
      }
      this.localColumn += 1
      this.tableData = this.makeTableData()
      this.updateBeMergeCell()
    },
    deleteRow() {
      const { from, to } = this.position.x
      this.tableData.splice(Math.min(from, to), Math.abs(to - from) + 1)
      this.localRow = this.localRow - (Math.abs(to - from) + 1)
      this.$emit('deleteRow', this.localRow)
    },
    deleteColumn() {
      const { from, to } = this.position.y
      this.localColumn = this.localColumn - (Math.abs(to - from) + 1)
      this.tableData.forEach((arr, index) => {
        arr.splice(Math.min(from, to), Math.abs(to - from) + 1)
      })
      this.$emit('deleteColumn', this.localColumn)
    },
    mergeTd() {
      const { localRow, localColumn } = this
      const mergeValue = []
      /**
       * 不做拷贝, 直接修改this.tableData
       * 因为修改的是数组的对象, 所以vue也能感知到数据变化
       */
      const tableData = this.tableData
      let minX, minY, maxX, maxY
      for (let r = 0; r < parseInt(localRow); r++) {
        for (let col = 0; col < parseInt(localColumn); col++) {
          // 被选中区域
          if (tableData[r][col].isSelect) {
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
          if (tableData[i][j].value !== '') {
            mergeValue.push(tableData[i][j].value)
          }
        }
      }

      this.tableData[minX][minY].value = String(mergeValue)
    },
    /**
     * 选中区域的数组重新生成
     */
    makeTableData() {
      const tableData = [...this.tableData]
      const { localRow, localColumn } = this
      for (let r = 0; r < localRow; r++) {
        const arr = []
        for (let col = 0; col < localColumn; col++) {
          let rowspanDefault = 1
          let colspanDefault = 1
          let isMerge = false
          if (this.tableData[r][col].colspan !== 1 || tableData[r][col].rowspan !== 1) {
            rowspanDefault = tableData[r][col].rowspan
            colspanDefault = tableData[r][col].colspan
          }
          if (tableData[r][col].isMerge) {
            isMerge = true
          }
          const isSelect = this.inRange(r, col)
          const obj = {
            value: this.tableData[r][col].value,
            x: r,
            y: col,
            isSelect,
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

      const maxXStart = xFrom + this.tableData[xFrom][yFrom].rowspan - 1
      const maxYStart = yFrom + this.tableData[xFrom][yFrom].colspan - 1
      const maxXEnd = xTo + this.tableData[xTo][yTo].rowspan - 1
      const maxYEnd = yTo + this.tableData[xTo][yTo].colspan - 1

      let minSelectX = Math.min(xFrom, xTo)
      let minSelectY = Math.min(yFrom, yTo)
      let maxSelectX = Math.max(maxXStart, maxXEnd)
      let maxSelectY = Math.max(maxYStart, maxYEnd)

      if (this.beMergeCell.length !== 0) {
        // 起始点间是否包含合并的单元格
        for (let i = 0; i < this.mergeCell.length; i++) {
          const mergeCellMinX = this.mergeCell[i].x
          const mergeCellMinY = this.mergeCell[i].y
          if ((mergeCellMinX >= minSelectX && mergeCellMinX <= maxSelectX) &&
              (mergeCellMinY >= minSelectY && mergeCellMinY <= maxSelectY)) {
            const rowspan = this.mergeCell[i].rowspan
            const colspan = this.mergeCell[i].colspan
            const mergeCellMaxX = mergeCellMinX + rowspan - 1
            const mergeCellMaxY = mergeCellMinY + colspan - 1
            minSelectX = mergeCellMinX < minSelectX ? mergeCellMinX : minSelectX
            maxSelectX = mergeCellMaxX > maxSelectX ? mergeCellMaxX : maxSelectX
            minSelectY = mergeCellMinY < minSelectY ? mergeCellMinY : minSelectY
            maxSelectY = mergeCellMaxY > maxSelectY ? mergeCellMaxY : maxSelectY
          }
        }

        // 起始点间是否包含被合并的单元格，并找到被合并单元格对应的合并单元格
        for (let i = 0; i < this.beMergeCell.length; i++) {
          const passCellX = this.beMergeCell[i].x
          const passCellY = this.beMergeCell[i].y
          if ((passCellX >= minSelectX && passCellX <= maxSelectX) &&
              (passCellY >= minSelectY && passCellY <= maxSelectY)) {
            for (let j = 0; j < this.mergeCell.length; j++) {
              const rowspan = this.mergeCell[j].rowspan
              const colspan = this.mergeCell[j].colspan
              const mergeCellMinX = this.mergeCell[j].x
              const mergeCellMinY = this.mergeCell[j].y
              const mergeCellMaxX = mergeCellMinX + rowspan - 1
              const mergeCellMaxY = mergeCellMinY + colspan - 1
              if ((passCellX >= mergeCellMinX && passCellX <= mergeCellMaxX) &&
                  (passCellY >= mergeCellMinY && passCellY <= mergeCellMaxY)) {
                minSelectX = mergeCellMinX < minSelectX ? mergeCellMinX : minSelectX
                maxSelectX = mergeCellMaxX > maxSelectX ? mergeCellMaxX : maxSelectX
                minSelectY = mergeCellMinY < minSelectY ? mergeCellMinY : minSelectY
                maxSelectY = mergeCellMaxY > maxSelectY ? mergeCellMaxY : maxSelectY
              }
            }
          }
        }
      }

      if ((x >= minSelectX && x <= maxSelectX) && (y >= minSelectY && y <= maxSelectY)) {
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
.cell{
  width: 100px;
  height: 30px;
}
</style>
