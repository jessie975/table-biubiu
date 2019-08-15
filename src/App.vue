<template>
  <div id="app">
    <div class="control">
      <span>行：</span><input v-model.number="rows" type="number">
      <span>列：</span><input v-model.number="columns" type="number">
      <button @click="handelClick">创建</button>
      <button @click="repeal">撤销</button>
    </div>
    <Table
      ref="table"
      :rows="rows"
      :columns="columns"
      @insertRow="insertRow"
      @insertColumn="insertColumn"
      @deleteRow="deleteRow"
      @deleteColumn="deleteColumn"
    />
  </div>
</template>

<script>
import Table from './components/Table'

export default {
  name: 'App',
  components: {
    Table
  },
  data() {
    return {
      rows: 10,
      columns: 10
    }
  },
  methods: {
    handelClick() {
      this.$refs.table.initTable()
    },
    repeal() {
      this.$refs.table.repeal()
    },
    insertRow(newRow) {
      this.rows = newRow
    },
    insertColumn(newColumn) {
      this.columns = newColumn
    },
    deleteRow(newRow) {
      console.log('TCL: deleteRow -> newRow', newRow)
      this.rows = newRow
    },
    deleteColumn(newColumn) {
      this.columns = newColumn
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.control{
  margin-bottom: 20px;
}
</style>
