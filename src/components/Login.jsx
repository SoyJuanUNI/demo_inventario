import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function Login() {
  const { dispatch } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e) => {
    e.preventDefault()
    dispatch({ type: 'login', payload: { username, password } })
  }

  return (
    <form onSubmit={submit} className="row" style={{ alignItems: 'flex-end' }}>
      <div className="col">
        <label>Usuario</label>
        <input placeholder="usuario" value={username} onChange={e => setUsername(e.target.value)} />
      </div>
      <div className="col">
        <label>Contraseña</label>
        <input placeholder="••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <div className="col" style={{ flex: '0 0 auto' }}>
        <button className="primary" type="submit">Ingresar</button>
      </div>
      <div className="col" style={{ minWidth: 200 }}>
        <div className="small">Accesos rápidos:</div>
        <div className="input-row">
          <button type="button" className="ghost" onClick={() => dispatch({ type: 'login', payload: { username: 'admin', password: 'admin' } })}>Admin</button>
          <button type="button" className="ghost" onClick={() => dispatch({ type: 'login', payload: { username: 'empleado', password: '1234' } })}>Empleado</button>
        </div>
      </div>
    </form>
  )
}
