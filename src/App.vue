<template>
  <div id="app">
    <span>行：</span><input v-model="rowNumber" type="number">
    <span>列：</span><input v-model="columnNumber" type="number">
    <button @click="handelClick">创建</button>
    <Table ref="table" :rows="Number(rowNumber)" :columns="Number(columnNumber)" :update-row.sync="updateRow" />
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
      rowNumber: '10',
      columnNumber: '10'
    }
  },
  methods: {
    handelClick() {
      this.$refs.table.initTable()
    },
    updateRow(value) {
      debugger
      console.log(value)
      this.rowNumber = String(value)
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
</style>
