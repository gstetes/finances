import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Input } from '../Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Nome" />)
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  })

  it('shows required asterisk when required', () => {
    render(<Input label="Email" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input label="Email" error="Campo obrigatório" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Campo obrigatório')
  })

  it('shows hint when no error', () => {
    render(<Input label="Senha" hint="Mínimo 8 caracteres" />)
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
  })

  it('hides hint when error is present', () => {
    render(<Input label="Senha" hint="Mínimo 8 caracteres" error="Senha inválida" />)
    expect(screen.queryByText('Mínimo 8 caracteres')).not.toBeInTheDocument()
  })

  it('calls onChange', async () => {
    const onChange = vi.fn()
    render(<Input label="Nome" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Nome'), 'a')
    expect(onChange).toHaveBeenCalled()
  })

  it('sets aria-invalid when error is present', () => {
    render(<Input label="Campo" error="Erro" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })
})
