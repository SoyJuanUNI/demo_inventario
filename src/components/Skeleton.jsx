import React from 'react'

export function SkeletonText({ width = '100%', height = '16px' }) {
  return (
    <div 
      className="skeleton skeleton-text" 
      style={{ width, height }}
    />
  )
}

export function SkeletonTable({ rows = 3, columns = 4 }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i}>
              <SkeletonText width="80%" height="14px" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex}>
                <SkeletonText 
                  width={colIndex === 0 ? '90%' : colIndex === columns - 1 ? '60%' : '70%'} 
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function SkeletonCard() {
  return (
    <div className="card">
      <SkeletonText width="40%" height="20px" style={{ marginBottom: '12px' }} />
      <SkeletonText width="100%" height="14px" />
      <SkeletonText width="80%" height="14px" />
      <SkeletonText width="60%" height="14px" />
    </div>
  )
}

export function SkeletonButton() {
  return <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '6px' }} />
}