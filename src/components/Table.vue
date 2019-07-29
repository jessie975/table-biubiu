<template>
  <div>
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
          :key="tdIndex"
          :data-x="item.x"
          :data-y="item.y"
          :data-value="item.value"
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
      record: false,
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
      handler(newName, oldName) {
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
    deleteRow() {
      const { from, to } = this.position.x
      this.tableData.splice(Math.min(from, to), (Math.abs(to - from) + 1))
      this.row = this.row - (Math.abs(to - from) + 1)
    },
    deleteColumn() {
      const { from, to } = this.position.y
      this.column = this.column - (Math.abs(to - from) + 1)
      this.tableData.forEach((arr, index) => {
        arr.splice(Math.min(from, to), (Math.abs(to - from) + 1))
      })
    },
    InsertRow() {
      const { from, to } = this.position.x
      const max = Math.max(from, to)
      const tableData = []
      const column = parseInt(this.column)
      for (let r = 0; r <= max + 1; r++) {
        const arr = []
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
            rowspan: 1, // TODO:
            colspan: 1 // TODO:
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
        for (let col = 0; col < parseInt(column) + 1; col++) {
          const select = this.inRange(r, col)
          let value = ''
          if (col === max + 1) { // 最新插入的列
            value = ''
          } else {
            if (col <= max) { // 插入列所在的前面的列
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
            rowspan: 1, // TODO:
            colspan: 1 // TODO:
          }
          arr.push(obj)
        }
        tableData[r] = arr
      }
      this.tableData = tableData
      this.column = parseInt(column) + 1
    },
    mergeTd(event) {
      const tableData = []
      let row = this.tableData.length // 原来有多少行
      /**
       * 如果一行都没有, 说明表格不存在, 不应该继续执行
       */
      if (row === 0) {
        return
      }

      const { from: fromY, to: toY } = this.position.y
      const { from: fromX, to: toX } = this.position.x
      const minY = Math.min(fromY, toY)
      const maxX = Math.max(fromX, toX)
      const minX = Math.min(fromX, toX)
      const rowspan = Math.abs(fromX - toX) + 1
      const colspan = Math.abs(fromY - toY) + 1
      console.log('TCL: mergeTd -> minX', minX)
      console.log('TCL: mergeTd -> minY', minY)
      console.log('TCL: mergeTd -> colspan', colspan)
      console.log('TCL: mergeTd -> rowspan', rowspan)

      // 选中所有的列的时候, 行的循环次数才会跟着变化
      const isAllCol = colspan === this.tableData[0].length
      console.log('TCL: mergeTd -> isAllCol', isAllCol)
      /**
       * 如果判断已经选中了所有的列,则循环次数要 - rowspan + 1
       */
      if (isAllCol) {
        row = row - rowspan + 1
      }

      for (let r = 0; r < row; r++) {
        /**
         * 计算被合并的单元格的循环次数
         */
        let column = this.tableData[r].length
        if (r === minX) {
          column = column - colspan + 1
        }
        // debugger 有等号 没选中行所有时候是正确的
        // 没等号, 选中全行时候是对的
        if (r > minX && r <= maxX) {
          if (!isAllCol) {
            column = column - colspan
          }
        }
        // -------------------------------

        const arr = []

        for (let col = 0; col < column; col++) {
          let rowspanDefault = 1
          let colspanDefault = 1
          let value = ''
          let x = r
          let y = col
          /**
           * 当前的td是被选中的最左上角那一个
           */
          if (r === minX && col === minY) {
            rowspanDefault = rowspan
            if (isAllCol) {
              rowspanDefault = 1
            }
            colspanDefault = colspan
          }

          /**
           * 当前选中行的上部分的value
           */
          if (r < minX) {
            value = this.tableData[r][col].value
          }

          /**
           * 选择的是一行的情况
           */
          if (r >= maxX && rowspan === 1) {
            if (isAllCol) { // 选择的是完整行, xy不变
              if (r === maxX) {
                value = this.tableData[r][col].value
              } else {
                value = this.tableData[r - rowspan + 1][col].value
              }
            } else { // 选择的不是完整行,xy变化
              value = this.tableData[r - rowspan + 1][col].value
              if (r === minX) { // 当前行是合并的那一行
                if (col >= minY + colspan - 1) {
                  x = r
                  y = colspan + col - 1
                }
              }
            }
          }
          /**
           * 选择的是多行
           */
          if (r >= minX && rowspan !== 1) {
            /**
             * 选中的是多行的整行
             */
            if (isAllCol) { // 选了多行的整行
              value = this.tableData[r + rowspan - 2][col].value
            } else {
              if (r !== maxX) { // 多行的非整行的下面的行
                value = this.tableData[r][col].value
              }
            }
          }

          /**
          * 选中的行的区域
          */
          if (r >= minX && r <= maxX && !isAllCol) {
            if (col === minY && r === minX) { // 选中的区域的最左上角
              value = this.tableData[minX][minY].value // 当前行的value取左上角的值
            } else { // 不是最左上角的区域
              if (col === minY) { // 和左上角在一行的区域
                value = this.tableData[r][col + colspan].value
                y = col + colspan
              } else {
                if (r === minX) {
                  if (col > minY) {
                    value = this.tableData[r][col + colspan - 1].value
                    y = col + colspan - 1
                  } else {
                    value = this.tableData[r][col].value
                  }
                } else {
                  if (col > minY) {
                    value = this.tableData[r][col + colspan].value
                    y = col + colspan
                  } else {
                    value = this.tableData[r][col].value
                  }
                }
              }
            }
          }

          const obj = {
            value,
            x,
            y,
            select: false,
            rowspan: rowspanDefault,
            colspan: colspanDefault
          }
          arr.push(obj)
        }
        tableData[r] = arr
      }
      this.tableData = tableData
      console.log('TCL: mergeTd -> tableData', tableData)
    },
    menuShow(event) {
      this.menuTop = event.clientY
      this.menuLeft = event.clientX
      event.preventDefault()
      return false
    },
    /**
     * 取消选中区域的选中
     */
    handlerClose(event) {
      if (!document.getElementById('menu').contains(event.target)) {
        this.menuTop = -800
        this.menuLeft = -800
      }
      if (document.getElementById('table').contains(event.target) || document.getElementById('menu').contains(event.target)) {
        return ''
      }
      this.position.x.from = -1
      this.position.y.from = -1
      this.position.x.to = -1
      this.position.y.to = -1
    },
    moveAction: throttle(function(event) {
      if (this.record) {
        const { x, y } = event.target.dataset
        this.position.x.to = parseInt(x)
        this.position.y.to = parseInt(y)
      }
    }, 100),

    /**
     * 点击右键之后直接修改选中区域
     */
    downActionOnece(event) {
      // 如果选择的区域不是一块
      if ((this.position.x.from - this.position.x.to !== 0) ||
          (this.position.y.from - this.position.y.to !== 0)
      ) {
        return
      }
      this.position.x.from = parseInt(event.target.dataset.x)
      this.position.y.from = parseInt(event.target.dataset.y)
      this.position.x.to = parseInt(event.target.dataset.x)
      this.position.y.to = parseInt(event.target.dataset.y)
    },
    /**
     * 初始化选中数据
     */
    downAction(event) {
      this.record = true
      this.position.x.from = parseInt(event.target.dataset.x)
      this.position.y.from = parseInt(event.target.dataset.y)
      this.position.x.to = parseInt(event.target.dataset.x)
      this.position.y.to = parseInt(event.target.dataset.y)
    },
    upAction(event) {
      this.record = false
    },
    /**
     * 输入完成
     */
    inputAction(event) {
      const { dataset: { x, y }, value } = event.target
      this.tableData[x][y].value = value
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
            value: `(${r}:${col})`,
            x: r,
            y: col,
            select: false,
            rowspan: 1,
            colspan: 1
          }
          arr.push(obj)
        }
        tableData.push(arr)
      }
      return tableData
    },
    /**
     * 选中区域的数组重新生成
     */
    makeTableData() {
      const tableData = [...this.tableData] // FIXME: 浅拷贝不适用于二维数组
      const row = tableData.length
      if (row === 0) {
        return []
      }
      for (let r = 0; r < parseInt(row); r++) {
        const arr = []
        const column = tableData[r].length
        for (let col = 0; col < parseInt(column); col++) {
          let rowspanDefault = 1
          let colspanDefault = 1
          if (tableData[r][col].rowspan !== 1 || tableData[r][col].colspan !== 1) {
            rowspanDefault = tableData[r][col].rowspan
            colspanDefault = tableData[r][col].colspan
          }
          const select = this.inRange(r, col)
          const obj = {
            value: tableData[r][col].value,
            x: r,
            y: col,
            select,
            rowspan: rowspanDefault,
            colspan: colspanDefault
          }
          arr.push(obj)
        }
        tableData[r] = arr
      }
      return tableData
    },
    inRange(x, y) {
      const { x: { from: xFrom, to: xTo }, y: { from: yFrom, to: yTo }} = this.position
      /**
       * 左上到右下
       */
      if ((x >= xFrom && x <= xTo) && (y >= yFrom && y <= yTo)) {
        return true
      }
      /**
       * 右下到左上
       */
      if ((x <= xFrom && x >= xTo) && (y <= yFrom && y >= yTo)) {
        return true
      }
      /**
       * 左下到右上
       */
      if ((x <= xFrom && x >= xTo) && (y >= yFrom && y <= yTo)) {
        return true
      }
      /**
       * 右上 到 左下
       */
      if ((x >= xFrom && x <= xTo) && (y <= yFrom && y >= yTo)) {
        return true
      }
      return false
    }
  }

}
</script>

<style scoped>
table {
  border-collapse: collapse;
  margin: 0 auto;
  text-align: center;
}
table:active,table:hover{
  border: 1px solid #cad9ea;
}
table td,
table th {
  border: 1px solid #cad9ea;
  color: #666;
  height: 30px;
  user-select: none;
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
table tr:nth-child(odd) {
  background: #fff;
}
table tr:nth-child(even) {
  background: #f5fafa;
}
.select{
  background:#FFFFCC;
}
</style>
