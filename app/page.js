'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
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

import { Box, Stack, Typography, Button, Modal, TextField, Select, MenuItem } from '@mui/material'

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, SetOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, {quantity: quantity + 1 })
    } else {
      await setDoc(docRef, { quantity: 1 })
    }
    await updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity > 1) {
        await setDoc(docRef, { quantity: quantity - 1 })
      } else {
        await deleteDoc(docRef)
      }
    }
    await updateInventory()
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => SetOpen(true)
  const handleClose = () => SetOpen(false)

  const filteredAndSortedInventory = inventory
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'quantity') {
        return b.quantity - a.quantity
      }
    })

  return (<Box  width="100vw" 
                height="100vh" 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center"
                gap = {2}>
                  
    <Modal open={open} onClose={handleClose}>
      <Box  position="absolute"
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
        variant="outlined"
        label="Item Name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
        <Button 
        variant="outlined"
        onClick={() => {
        addItem(itemName) 
        setItemName('') 
        handleClose()
        }}
        >Add</Button>
      </Box>
    </Modal>


    <Typography variant="h1">Inventory Management</Typography>
    <Button variant="contained" onClick={handleOpen}>Add New Item</Button>
    <Box border="1px solid black" width="800px">
      <Box width="100%" height="100px" bgcolor="lightblue" display="flex" alignItems="center" justifyContent="center">
        <Typography variant="h4">Inventory Items</Typography>
      </Box>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <TextField
          placeholder="🔍 Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '60%' }}
        />
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          displayEmpty
          inputProps={{ 'aria-label': 'Sort by' }}
        >
          <MenuItem value="name">Sort by Name</MenuItem>
          <MenuItem value="quantity">Sort by Quantity</MenuItem>
        </Select>
      </Box>

      <Stack width="100%"  height="300px" spacing={2} overflow="auto">
        {
          filteredAndSortedInventory.map((item) => (
            <Box key={item.name}  // Added this line
            width="100%"
            minHeight="150px"
            display={'flex'}
            justifyContent={'space-between'}
            alignItems={'center'}
            bgcolor={'#f0f0f0'}
            paddingX={5}>
            <Typography variant="h4" textAlign={'center'}>{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</Typography>
            <Typography variant="h4" textAlign={'center'}>{item.quantity}</Typography>
            <Button variant="contained" onClick={() => addItem(item.name)}>Add</Button>
            <Button variant="contained" onClick={() => removeItem(item.name)}>Remove</Button>
          </Box>
        ))
      }
    </Stack>
    </Box>
  </Box>)
}