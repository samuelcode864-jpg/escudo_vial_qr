import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbFile = path.resolve(__dirname, 'data/database.json')

function readDatabase() {
  try {
    if (fs.existsSync(dbFile)) {
      const raw = fs.readFileSync(dbFile, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error('Error reading database.json:', err)
  }
  return { qrList: [], emergencies: [], reports: [] }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Error writing database.json:', err)
  }
}

function dbSyncPlugin() {
  const sseClients = new Set()

  function broadcast(data) {
    const payload = `data: ${JSON.stringify(data)}\n\n`
    for (const client of sseClients) {
      try {
        client.write(payload)
      } catch {
        sseClients.delete(client)
      }
    }
  }

  return {
    name: 'db-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || ''

        // SSE Endpoint para sincronización en tiempo real
        if (url === '/api/database/stream') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          })
          res.write(': connected\n\n')
          sseClients.add(res)

          req.on('close', () => {
            sseClients.delete(res)
          })
          return
        }

        // GET database state
        if (url === '/api/database' && req.method === 'GET') {
          const db = readDatabase()
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(JSON.stringify(db))
          return
        }

        // POST update database state
        if (url === '/api/database' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body)
              let db = readDatabase()

              if (incoming.type === 'SET_STATE') {
                db = { ...db, ...incoming.payload }
              } else if (incoming.type === 'UPDATE_QR') {
                const target = incoming.payload
                const idx = db.qrList.findIndex(q => q.sku.toUpperCase() === target.sku.toUpperCase())
                if (idx >= 0) {
                  db.qrList[idx] = { ...db.qrList[idx], ...target }
                } else {
                  db.qrList.unshift(target)
                }
              } else if (incoming.type === 'BATCH_QRS') {
                db.qrList = [...incoming.payload, ...db.qrList]
              } else if (incoming.type === 'NEW_EMERGENCY') {
                db.emergencies = [incoming.payload, ...db.emergencies.filter(e => e.id !== incoming.payload.id)]
              } else if (incoming.type === 'UPDATE_EMERGENCY') {
                db.emergencies = db.emergencies.map(e => e.id === incoming.payload.id ? incoming.payload : e)
              } else if (incoming.type === 'DELETE_EMERGENCY') {
                db.emergencies = db.emergencies.filter(e => e.id !== incoming.payload.id)
              } else if (incoming.type === 'CLEAR_RESOLVED') {
                db.emergencies = db.emergencies.filter(e => e.status !== 'resuelto')
              } else if (incoming.type === 'NEW_REPORT') {
                db.reports = [incoming.payload, ...db.reports.filter(r => r.id !== incoming.payload.id)]
              }

              writeDatabase(db)
              broadcast({ type: incoming.type, data: db })

              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              })
              res.end(JSON.stringify({ success: true, db }))
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: e.message }))
            }
          })
          return
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), dbSyncPlugin()],
  server: {
    watch: {
      ignored: ['**/database.json', '**/data/**', '**/src/data/**']
    }
  }
})
