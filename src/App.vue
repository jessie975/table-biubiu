<template>
  <div id="app">
    <div class="control">
      <span>行：</span><input v-model.number="rows" type="number">
      <span>列：</span><input v-model.number="columns" type="number">
      <button @click="handelClick">创建</button>
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
  text-align: center;
  margin-top: 60px;
}
.control{
  margin-bottom: 20px;
}
</style>
