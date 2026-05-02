import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Table } from '../Table'

describe('Table', () => {
  it('renders headers and rows', () => {
    render(
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Valor</Table.Th>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Row>
            <Table.Td>Salário</Table.Td>
            <Table.Td>R$ 5.000</Table.Td>
          </Table.Row>
        </Table.Body>
      </Table>,
    )
    expect(screen.getByText('Nome')).toBeInTheDocument()
    expect(screen.getByText('Salário')).toBeInTheDocument()
  })

  it('calls onClick on row click', async () => {
    const onClick = vi.fn()
    render(
      <Table>
        <Table.Body>
          <Table.Row onClick={onClick}>
            <Table.Td>Item</Table.Td>
          </Table.Row>
        </Table.Body>
      </Table>,
    )
    await userEvent.click(screen.getByText('Item'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders empty state', () => {
    render(
      <Table>
        <Table.Body>
          <Table.Empty colSpan={3} message="Sem registros" />
        </Table.Body>
      </Table>,
    )
    expect(screen.getByText('Sem registros')).toBeInTheDocument()
  })
})
