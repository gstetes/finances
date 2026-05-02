import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card } from '../Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Conteúdo</Card>)
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('renders Header, Body and Footer subcomponents', () => {
    render(
      <Card>
        <Card.Header>Cabeçalho</Card.Header>
        <Card.Body>Corpo</Card.Body>
        <Card.Footer>Rodapé</Card.Footer>
      </Card>,
    )
    expect(screen.getByText('Cabeçalho')).toBeInTheDocument()
    expect(screen.getByText('Corpo')).toBeInTheDocument()
    expect(screen.getByText('Rodapé')).toBeInTheDocument()
  })
})
