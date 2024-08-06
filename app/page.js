'use client'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { firestore } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'

import { Box, Stack, Typography, Button, Modal, TextField, Select, MenuItem, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import SearchIcon from '@mui/icons-material/Search'
import SortIcon from '@mui/icons-material/Sort'
import EditIcon from '@mui/icons-material/Edit'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, description: '', price: '', supplier: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [editItem, setEditItem] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importData, setImportData] = useState('')
  const [importMethod, setImportMethod] = useState('paste')
  const fileInputRef = useRef(null)

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }

  const addItem = async () => {
    if (!newItem.name) {
      console.error('Cannot add item: Item name is empty');
      return;
    }
    const docRef = doc(collection(firestore, 'inventory'), newItem.name);
    await setDoc(docRef, { 
      name: newItem.name,
      quantity: parseInt(newItem.quantity) || 1,
      description: newItem.description || '',
      price: parseFloat(newItem.price) || 0,
      supplier: newItem.supplier || ''
    });
    await updateInventory();
    setNewItem({ name: '', quantity: 0, description: '', price: '', supplier: '' });
    handleClose();
  }

  const incrementItem = async (item) => {
    if (!item || !item.name) {
      console.error('Cannot increment item: Invalid item');
      return;
    }
    const docRef = doc(collection(firestore, 'inventory'), item.name);
    await setDoc(docRef, { 
      ...item,
      quantity: (item.quantity || 0) + 1
    }, { merge: true });
    await updateInventory();
  }

  const removeItem = async (item) => {
    if (!item) {
      console.error('Cannot remove item: Item name is empty');
      return;
    }

    const docRef = doc(collection(firestore, 'inventory'), item.name);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentData = docSnap.data();
      const newQuantity = (currentData.quantity || 0) - 1;
      if (newQuantity > 0) {
        await setDoc(docRef, { ...currentData, quantity: newQuantity }, { merge: true });
      } else {
        await deleteDoc(docRef);
      }
    }
    await updateInventory();
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleEditOpen = (item) => {
    setEditItem({
      ...item,
      originalName: item.name,
      quantity: item.quantity || 0,
      price: item.price || 0,
      description: item.description || '',
      supplier: item.supplier || ''
    });
    setEditOpen(true);
  }

  const handleEditClose = () => {
    setEditItem(null)
    setEditOpen(false)
  }

  const updateItemDetails = async () => {
    if (editItem && editItem.name) {
      const oldDocRef = doc(collection(firestore, 'inventory'), editItem.originalName);
      const newDocRef = doc(collection(firestore, 'inventory'), editItem.name);

      if (editItem.originalName !== editItem.name) {
        // Delete the old document and create a new one with the updated name
        await deleteDoc(oldDocRef);
      }

      await setDoc(newDocRef, {
        name: editItem.name,
        quantity: parseInt(editItem.quantity) || 0,
        description: editItem.description || '',
        price: parseFloat(editItem.price) || 0,
        supplier: editItem.supplier || ''
      }, { merge: true });

      await updateInventory();
      handleEditClose();
    } else {
      console.error('Cannot update item: Item name is empty');
    }
  }

  const exportToCSV = () => {
    const headers = ['name', 'quantity', 'description', 'price', 'supplier']
    const csvContent = [
      headers.join(','),
      ...inventory.map(item => 
        headers.map(header => item[header] || '').join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'inventory.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleImportOpen = () => setImportOpen(true)
  const handleImportClose = () => {
    setImportOpen(false)
    setImportData('')
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setImportData(e.target.result)
      reader.readAsText(file)
    }
  }

  const importFromCSV = async () => {
    const rows = importData.split('\n').map(row => row.split(','))
    const headers = rows[0]
    const items = rows.slice(1).map(row => {
      const item = {}
      headers.forEach((header, index) => {
        item[header.trim()] = row[index].trim()
      })
      return item
    })

    // Get all current items
    const snapshot = await getDocs(collection(firestore, 'inventory'))
    const currentItems = new Set(snapshot.docs.map(doc => doc.id))

    // Add or update items from CSV
    for (const item of items) {
      if (!item.name) continue // Skip items without a name
      const docRef = doc(collection(firestore, 'inventory'), item.name)
      await setDoc(docRef, {
        name: item.name,
        quantity: parseInt(item.quantity) || 0,
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        supplier: item.supplier || ''
      })
      currentItems.delete(item.name) // Remove from set of current items
    }

    // Delete items not in the CSV
    for (const itemName of currentItems) {
      await deleteDoc(doc(firestore, 'inventory', itemName))
    }

    await updateInventory()
    handleImportClose()
  }

  const filteredAndSortedInventory = inventory
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.price.toString().includes(searchTerm) ||
      item.quantity.toString().includes(searchTerm)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'quantity':
          return (b.quantity || 0) - (a.quantity || 0)
        case 'price':
          return (b.price || 0) - (a.price || 0)
        case 'supplier':
          return (a.supplier || '').localeCompare(b.supplier || '')
        default:
          return 0
      }
    })

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        bgcolor: '#f5f5f5',
      }}
    >
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid black"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Typography variant="h5">Add Item</Typography>
          <TextField
            label="Item Name"
            value={newItem.name}
            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
          />
          <TextField
            label="Quantity"
            type="number"
            value={newItem.quantity}
            onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
          />
          <TextField
            label="Description"
            multiline
            rows={3}
            value={newItem.description}
            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
          />
          <TextField
            label="Price"
            type="number"
            value={newItem.price}
            onChange={(e) => setNewItem({...newItem, price: e.target.value})}
          />
          <TextField
            label="Supplier"
            value={newItem.supplier}
            onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
          />
          <Button variant="contained" onClick={addItem}>Add</Button>
        </Box>
      </Modal>

      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Item Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Name"
              value={editItem?.name || ''}
              onChange={(e) => setEditItem({...editItem, name: e.target.value})}
            />
            <TextField
              label="Quantity"
              type="number"
              value={editItem?.quantity || ''}
              onChange={(e) => setEditItem({...editItem, quantity: e.target.value})}
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={editItem?.description || ''}
              onChange={(e) => setEditItem({...editItem, description: e.target.value})}
            />
            <TextField
              label="Price"
              type="number"
              value={editItem?.price || ''}
              onChange={(e) => setEditItem({...editItem, price: e.target.value})}
            />
            <TextField
              label="Supplier"
              value={editItem?.supplier || ''}
              onChange={(e) => setEditItem({...editItem, supplier: e.target.value})}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={updateItemDetails}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importOpen} onClose={handleImportClose}>
        <DialogTitle>Import Inventory from CSV</DialogTitle>
        <DialogContent>
          <Select
            value={importMethod}
            onChange={(e) => setImportMethod(e.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem value="paste">Paste CSV content</MenuItem>
            <MenuItem value="file">Upload CSV file</MenuItem>
          </Select>
          {importMethod === 'paste' ? (
            <TextField
              label="Paste CSV content here"
              multiline
              rows={10}
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              fullWidth
              margin="normal"
            />
          ) : (
            <Button
              variant="contained"
              component="label"
              sx={{ mt: 2 }}
              startIcon={<FileUploadIcon />}
            >
              Upload File
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportClose}>Cancel</Button>
          <Button onClick={importFromCSV}>Import</Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h2" fontWeight="bold" color="primary">Inventory Management</Typography>
      <Box display="flex" gap={2}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>Add New Item</Button>
        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportToCSV}>Export to CSV</Button>
        <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={handleImportOpen}>Import from CSV</Button>
      </Box>

      <Paper elevation={3} sx={{ width: "90%", maxWidth: "1000px", overflow: "hidden" }}>
        <Box sx={{ p: 3, bgcolor: "primary.main", color: "white" }}>
          <Typography variant="h4">Inventory Items</Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <TextField
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: '70%' }}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            displayEmpty
            inputProps={{ 'aria-label': 'Sort by' }}
            startAdornment={<SortIcon color="action" sx={{ mr: 1 }} />}
          >
            <MenuItem value="name">Sort by Name</MenuItem>
            <MenuItem value="quantity">Sort by Quantity</MenuItem>
            <MenuItem value="price">Sort by Price</MenuItem>
            <MenuItem value="supplier">Sort by Supplier</MenuItem>
          </Select>
        </Box>

        <Stack sx={{ maxHeight: "400px", overflow: "auto" }}>
          {filteredAndSortedInventory.map((item) => (
            <Box
              key={item.name}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid #e0e0e0',
                '&:hover': { bgcolor: '#f5f5f5' },
              }}
            >
              <Box>
                <Typography variant="h6">{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description ? item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '') : 'No description'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Price: ${item.price ? item.price.toFixed(2) : 'N/A'} | Supplier: {item.supplier || 'N/A'}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">{item.quantity}</Typography>
                <IconButton color="primary" onClick={() => incrementItem(item)}><AddIcon /></IconButton>
                <IconButton color="secondary" onClick={() => removeItem(item)}><RemoveIcon /></IconButton>
                <IconButton color="info" onClick={() => handleEditOpen(item)}><EditIcon /></IconButton>
              </Box>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  )
}