<template>
  <div id="app">
    <span>行：</span><input v-model.number="rows" type="number">
    <span>列：</span><input v-model.number="columns" type="number">
    <button @click="handelClick">创建</button>
    <Table
      ref="table"
      :rows="rows"
      :columns="columns"
      @updateRow="updateRow"
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
      columns: 10,
      data: []
    }
  },
  methods: {
    handelClick() {
      this.$refs.table.initTable()
    },
    updateRow(newRow) {
      console.log('TCL: updateRow -> newRow', newRow)
      this.rows = newRow
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
