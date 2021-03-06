const express = require('express')
const next = require('next')
const vhost = require('vhost')

const port = process.env.PORT || 3000
const dev = process.env.NODE_ENV === 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const domain = dev ? 'lvh.me' : 'localhost'

app.prepare().then(() => {

  const subdomains = ['admin.', 'member.']

  const servers = subdomains.map(servername => express())
  const mainServer = express()

  servers.map((server, index) => {
    server.get('/', (req, res) => {
      console.log(`handle 1 /${subdomains[index].slice(0, -1)}`)
      return app.render(req, res, `/${subdomains[index].slice(0, -1)}`, req.query)
    })
  
    server.get('/*', (req, res) => {
      console.log(`handle 2 /${subdomains[index].slice(0, -1)}${req.path}`)
      return app.render(req, res, `/${subdomains[index].slice(0, -1)}${req.path}`, req.query)
    })
  
    server.all('*', (req, res) => {
      console.log('handle 3')
      return handle(req, res)
    })
  })

  servers.map((server, index) =>{
    mainServer.use(vhost(`${subdomains[index]}${domain}`, server))
  })

  mainServer.get('/', (req, res) => {
    console.log('handle main 1')
    return app.render(req, res, `/main`, req.query)
  })

  mainServer.get('/*', (req, res) => {
    console.log('handle main 2')
    return app.render(req, res, `/main${req.path}`, req.query)
  })

  mainServer.all('*', (req, res) => {
    console.log('handle main 3')
    return handle(req, res)
  })

  mainServer.listen(port, (err) => {
    if (err) throw err

    console.log(`> Ready on http://${domain}:${port}`)
  })
})
