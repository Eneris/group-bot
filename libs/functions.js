module.exports = {
  log: (...props) => console.log("["+(new Date()).toLocaleString()+"]", ...props),
  error: (...props) => console.error("["+(new Date()).toLocaleString()+"]", ...props)
}