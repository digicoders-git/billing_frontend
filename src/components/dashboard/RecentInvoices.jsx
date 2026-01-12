import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Box,
  Flex,
  Text,
  IconButton,
  Menu,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { FileText, ChevronDown, MoreVertical } from 'lucide-react';

const invoices = [
  { id: '#INV9783421', customer: 'Skylar Price', date: '11/20/2024', amount: '₹35,400', status: 'Delivered', statusColor: 'green' },
  { id: '#INV9783412', customer: 'Julian Jenkins', date: '11/09/2024', amount: '₹91,000', status: 'In Progress', statusColor: 'blue' },
  { id: '#INV9783431', customer: 'Aiden Watson', date: '11/15/2024', amount: '₹42,000', status: 'Pending', statusColor: 'orange' },
  { id: '#INV9783445', customer: 'Emma Stone', date: '11/22/2024', amount: '₹12,000', status: 'Delivered', statusColor: 'green' },
  { id: '#INV9783456', customer: 'John Doe', date: '11/25/2024', amount: '₹67,500', status: 'Pending', statusColor: 'orange' }
];

const RecentInvoices = () => {
  return (
    <Box className="chart-container h-full flex flex-col">
      <Flex align="center" justify="space-between" mb={6}>
        <Flex align="center" gap={3}>
          <Box p={2} bg="blue.50" rounded="lg">
            <FileText color="#667eea" size={20} />
          </Box>
          <Box>
            <Text fontSize="lg" fontWeight="bold" color="gray.900">Recent Invoices</Text>
            <Text fontSize="sm" color="gray.500">Latest transactions</Text>
          </Box>
        </Flex>
        
        <Flex align="center" gap={2} bg="gray.50" px={3} py={2} rounded="lg" cursor="pointer">
          <Text fontSize="sm" color="gray.600">Sales Invoice</Text>
          <ChevronDown size={16} />
        </Flex>
      </Flex>

      <TableContainer flex={1}>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th color="gray.500" fontSize="xs" fontWeight="600">Invoice ID</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="600">Customer</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="600">Date</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="600">Amount</Th>
              <Th color="gray.500" fontSize="xs" fontWeight="600">Status</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {invoices.map((invoice) => (
              <Tr key={invoice.id} _hover={{ bg: 'gray.50' }}>
                <Td>
                  <Text fontWeight="600" color="gray.700" fontSize="sm">
                    {invoice.id}
                  </Text>
                </Td>
                <Td>
                  <Text color="gray.600" fontSize="sm">
                    {invoice.customer}
                  </Text>
                </Td>
                <Td>
                  <Text color="gray.500" fontSize="sm">
                    {invoice.date}
                  </Text>
                </Td>
                <Td>
                  <Text fontWeight="600" color="gray.800" fontSize="sm">
                    {invoice.amount}
                  </Text>
                </Td>
                <Td>
                  <Badge
                    colorScheme={invoice.statusColor}
                    variant="subtle"
                    fontSize="xs"
                    px={2}
                    py={1}
                    rounded="full"
                  >
                    {invoice.status}
                  </Badge>
                </Td>
                <Td>
                  <Menu>
                    <IconButton
                      as="button"
                      icon={<MoreVertical size={16} />}
                      variant="ghost"
                      size="sm"
                    />
                    <MenuList>
                      <MenuItem>View Details</MenuItem>
                      <MenuItem>Edit Invoice</MenuItem>
                      <MenuItem>Download PDF</MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RecentInvoices;