import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Modal } from '../Modal'

describe('Modal', () => {
  it('does not render when open=false', () => {
    render(<Modal open={false} title="Teste">Conteúdo</Modal>)
    expect(screen.queryByText('Conteúdo')).not.toBeInTheDocument()
  })

  it('renders when open=true', () => {
    render(<Modal open title="Meu Modal">Conteúdo do modal</Modal>)
    expect(screen.getByText('Conteúdo do modal')).toBeInTheDocument()
    expect(screen.getByText('Meu Modal')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<Modal open title="Modal" onClose={onClose}>Conteúdo</Modal>)
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn()
    render(<Modal open title="Modal" onClose={onClose}>Conteúdo</Modal>)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
