import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Pago</Badge>)
    expect(screen.getByText('Pago')).toBeInTheDocument()
  })

  it('applies success variant class', () => {
    render(<Badge variant="success">OK</Badge>)
    expect(screen.getByText('OK')).toHaveClass('bg-green-100')
  })

  it('applies danger variant class', () => {
    render(<Badge variant="danger">Erro</Badge>)
    expect(screen.getByText('Erro')).toHaveClass('bg-red-100')
  })

  it('applies custom style', () => {
    render(<Badge style={{ backgroundColor: '#123456' }}>Custom</Badge>)
    expect(screen.getByText('Custom')).toHaveStyle({ backgroundColor: '#123456' })
  })
})
