import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CurrencyInput } from '../CurrencyInput'

describe('CurrencyInput', () => {
  it('renders with label', () => {
    render(<CurrencyInput label="Valor" />)
    expect(screen.getByLabelText('Valor')).toBeInTheDocument()
  })

  it('shows R$ prefix', () => {
    render(<CurrencyInput label="Valor" />)
    expect(screen.getByText('R$')).toBeInTheDocument()
  })

  it('calls onChange with numeric value', async () => {
    const onChange = vi.fn()
    render(<CurrencyInput label="Valor" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Valor'), '100')
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1] as [number]
    expect(typeof lastCall[0]).toBe('number')
  })

  it('shows error message', () => {
    render(<CurrencyInput label="Valor" error="Valor inválido" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Valor inválido')
  })

  it('formats display value', () => {
    render(<CurrencyInput label="Valor" value={1500} onChange={() => {}} />)
    expect(screen.getByLabelText('Valor')).toHaveValue('1.500,00')
  })
})
