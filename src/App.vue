<template>
  <div id="app">
    行：<input v-model="rowNumber" type="number">
    列：<input v-model="columnNumber" type="number">
    <button @click="handelClick">创建</button>
    <Table ref="table" :row="Number(rowNumber)" :column="Number(columnNumber)" />
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
      rowNumber: '',
      columnNumber: ''
    }
  },
  methods: {
    handelClick() {
      this.$refs.table.initTable()
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
