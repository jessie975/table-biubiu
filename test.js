{
  const year = 2009

  const isRunYear = year => {
    const date = new Date()
    date.setYear(year)
    date.setMonth(1)
    date.setDate(29)
    console.log('TCL: date', date)
    if (date.getMonth() === 2) {
      return false
    }
    return true
  }

  const is = isRunYear(year)
  console.log('TCL: is', is)
}

{
  const str = 'i am arley, my age is 18, i very cool'
  if (str.indexOf('cool') > -1) {
    console.log('TCL: cool')
  }
  if (/cool/.test(str)) {
    console.log('TCL: cool')
  }
}
