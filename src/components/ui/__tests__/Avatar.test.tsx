import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Avatar } from '../Avatar'

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" name="João Silva" />)
    expect(screen.getByRole('img', { name: 'João Silva' })).toBeInTheDocument()
  })

  it('renders initials when no src', () => {
    render(<Avatar name="João Silva" />)
    expect(screen.getByText('JS')).toBeInTheDocument()
  })

  it('renders ? when no name and no src', () => {
    render(<Avatar />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('uses single initial for single-word name', () => {
    render(<Avatar name="João" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })
})
