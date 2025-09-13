import React, { useState } from 'react'
import { useUI } from '../hooks/useUI'
import { useDemoControls } from '../hooks/useDemoControls'
import { EnhancedButton, ActionButton } from './EnhancedButton'

export function SystemSettings() {
  const { ui, setRememberSession, setAllowDuplicateTableNames, getStorageInfo } = useUI()
  const { 
    resetToInitialState, 
    createManualSnapshot, 
    getSnapshots, 
    restoreFromSnapshot,
    removeSnapshot,
    generateTestData,
    clearTestData,
    clearAllStorageData
  } = useDemoControls()
  
  const [snapshots, setSnapshots] = useState(getSnapshots())
  const [showSnapshots, setShowSnapshots] = useState(false)
  const storageInfo = getStorageInfo()

  const refreshSnapshots = () => {
    setSnapshots(getSnapshots())
  }

  const handleCreateSnapshot = () => {
    const name = prompt('Nombre para el snapshot (opcional):')
    const result = createManualSnapshot(name?.trim() || undefined)
    if (result.success) {
      refreshSnapshots()
    }
  }

  const handleRestoreSnapshot = (snapshotName) => {
    if (window.confirm(`¿Restaurar el sistema desde "${snapshotName}"? Esto sobrescribirá el estado actual.`)) {
      const result = restoreFromSnapshot(snapshotName)
      if (result.success) {
        refreshSnapshots()
      }
    }
  }

  const handleDeleteSnapshot = (snapshotName) => {
    if (window.confirm(`¿Eliminar el snapshot "${snapshotName}"?`)) {
      const result = removeSnapshot(snapshotName)
      if (result.success) {
        refreshSnapshots()
      }
    }
  }

  return (
    <div className="card">
      <h3>⚙️ Configuraciones del Sistema</h3>
      
      {/* Persistencia */}
      <div style={{ marginBottom: '16px' }}>
        <h4>💾 Persistencia de Datos</h4>
        <div className="row">
          <div className="col">
            <label>
              <input
                type="checkbox"
                checked={ui?.rememberSession || false}
                onChange={(e) => setRememberSession(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              📌 Recordar mi sesión
            </label>
            <div className="small" style={{ marginTop: '4px', color: 'var(--muted)' }}>
              Mantiene tu progreso entre sesiones del navegador
            </div>
          </div>
          <div className="col">
            <div className="small">
              <strong>Almacenamiento:</strong> {storageInfo.formattedSize}
            </div>
            <div className="small">
              <strong>Estado:</strong> {storageInfo.persistent ? '✅ Activo' : '❌ Inactivo'}
            </div>
          </div>
        </div>
      </div>

      <hr className="sep" />

      {/* Validaciones */}
      <div style={{ marginBottom: '16px' }}>
        <h4>🛡️ Validaciones</h4>
        <div className="row">
          <div className="col">
            <label>
              <input
                type="checkbox"
                checked={ui?.allowDuplicateTableNames || false}
                onChange={(e) => setAllowDuplicateTableNames(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              🏷️ Permitir nombres de mesa duplicados
            </label>
            <div className="small" style={{ marginTop: '4px', color: 'var(--muted)' }}>
              Si está desactivado, no se permitirán mesas con el mismo nombre
            </div>
          </div>
        </div>
      </div>

      <hr className="sep" />

      {/* Demo Controls */}
      <div style={{ marginBottom: '16px' }}>
        <h4>🎭 Controles de Demo</h4>
        <div className="row">
          <div className="col">
            <div className="input-row">
              <ActionButton
                className="danger"
                onClick={resetToInitialState}
                confirm={true}
                confirmMessage="¿Restablecer todo al estado inicial? Se creará un respaldo automático."
              >
                🔄 Restablecer Demo
              </ActionButton>
              
              <EnhancedButton
                className="success"
                onClick={generateTestData}
              >
                🧪 Generar Datos de Prueba
              </EnhancedButton>

              <ActionButton
                className="ghost"
                onClick={clearTestData}
                confirm={true}
                confirmMessage="¿Eliminar todos los datos de prueba?"
              >
                🗑️ Limpiar Datos de Prueba
              </ActionButton>
            </div>
          </div>
        </div>
      </div>

      <hr className="sep" />

      {/* Snapshots */}
      <div>
        <div className="row" style={{ alignItems: 'center', marginBottom: '8px' }}>
          <div className="col">
            <h4>📸 Snapshots del Sistema</h4>
          </div>
          <div className="col" style={{ flex: '0 0 auto' }}>
            <div className="input-row">
              <EnhancedButton
                className="success"
                onClick={handleCreateSnapshot}
              >
                📸 Crear Snapshot
              </EnhancedButton>
              <EnhancedButton
                className="ghost"
                onClick={() => setShowSnapshots(!showSnapshots)}
              >
                {showSnapshots ? '🔼' : '🔽'} {showSnapshots ? 'Ocultar' : 'Mostrar'}
              </EnhancedButton>
            </div>
          </div>
        </div>

        {showSnapshots && (
          <div>
            {snapshots.length === 0 ? (
              <div className="small" style={{ color: 'var(--muted)', textAlign: 'center', padding: '16px' }}>
                No hay snapshots guardados
              </div>
            ) : (
              <table className="table compact">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map(snapshot => (
                    <tr key={snapshot.key}>
                      <td><strong>{snapshot.name}</strong></td>
                      <td className="small">
                        {new Date(snapshot.timestamp).toLocaleString('es-CO')}
                      </td>
                      <td>
                        <div className="input-row">
                          <ActionButton
                            className="success small"
                            onClick={() => handleRestoreSnapshot(snapshot.name)}
                            confirm={true}
                            confirmMessage={`¿Restaurar desde "${snapshot.name}"?`}
                          >
                            ↩️ Restaurar
                          </ActionButton>
                          <ActionButton
                            className="danger small"
                            onClick={() => handleDeleteSnapshot(snapshot.name)}
                            confirm={true}
                            confirmMessage={`¿Eliminar "${snapshot.name}"?`}
                          >
                            🗑️
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div style={{ marginTop: '12px' }}>
          <ActionButton
            className="danger"
            onClick={clearAllStorageData}
            confirm={true}
            confirmMessage="¿Eliminar TODOS los datos persistentes incluyendo configuraciones y snapshots?"
          >
            🚨 Limpiar Todo el Almacenamiento
          </ActionButton>
        </div>
      </div>
    </div>
  )
}