import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ColorPicker } from '../ColorPicker'

describe('ColorPicker', () => {
  it('renders with label', () => {
    render(<ColorPicker label="Cor" onChange={() => {}} />)
    expect(screen.getByText('Cor')).toBeInTheDocument()
  })

  it('renders preset color swatches', () => {
    render(<ColorPicker onChange={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(10)
  })

  it('calls onChange with color value when swatch clicked', async () => {
    const onChange = vi.fn()
    render(<ColorPicker onChange={onChange} />)
    const firstSwatch = screen.getAllByRole('button')[0]
    await userEvent.click(firstSwatch)
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^#/))
  })

  it('shows aria-pressed on selected color', () => {
    render(<ColorPicker value="#ef4444" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '#ef4444' })).toHaveAttribute('aria-pressed', 'true')
  })
})
