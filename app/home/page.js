'use client'
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

import { Box, Stack, Typography, Button, Modal, TextField, Select, MenuItem, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Container, Grid, Card, CardContent, CardActions } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import SearchIcon from '@mui/icons-material/Search'
import SortIcon from '@mui/icons-material/Sort'
import EditIcon from '@mui/icons-material/Edit'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { getAuth, signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { keyframes } from '@mui/system';
import DeleteIcon from '@mui/icons-material/Delete';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

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
  const [darkMode, setDarkMode] = useState(false);
  const [chartTab, setChartTab] = useState(0)
  const [user, setUser] = useState(null)
  const auth = getAuth()
  const router = useRouter()

  const glowKeyframes = keyframes`
    0% { text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 15px #ff0000; }
    50% { text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000; }
    100% { text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 15px #ff0000; }
  `;

  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#ff0000', // Red color
      },
      background: {
        default: '#000000',
        paper: '#121212',
      },
      text: {
        primary: '#ffffff',
        secondary: '#b0b0b0',
      },
    },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      if (user) {
        updateInventory(user.uid)
      } else {
        router.push('/')
      }
    })
    return () => unsubscribe()
  }, [auth, router])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Error signing out', error)
    }
  }

  const updateInventory = async (userId) => {
    if (!userId) return;
    const snapshot = query(collection(firestore, `users/${userId}/inventory`));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  }

  const addItem = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), newItem.name);
    try {
      await setDoc(docRef, {
        name: newItem.name,
        quantity: parseInt(newItem.quantity) || 1,
        description: newItem.description || '',
        price: parseFloat(newItem.price) || 0,
        supplier: newItem.supplier || ''
      });
      console.log('Item added successfully');
      await updateInventory(user.uid);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  }

  const incrementItem = async (item) => {
    if (!item || !item.name || !user) {
      console.error('Cannot increment item: Invalid item or user is not logged in');
      return;
    }
    const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item.name);
    await setDoc(docRef, { 
      ...item,
      quantity: (item.quantity || 0) + 1
    }, { merge: true });
    await updateInventory(user.uid);
  }

  const removeItem = async (item) => {
    if (!item || !user) {
      console.error('Cannot remove item: Item name is empty or user is not logged in');
      return;
    }

    const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item.name);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentData = docSnap.data();
      const newQuantity = Math.max((currentData.quantity || 0) - 1, 0);
      await setDoc(docRef, { ...currentData, quantity: newQuantity }, { merge: true });
    }
    await updateInventory(user.uid);
  }

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
    if (editItem && editItem.name && user) {
      const oldDocRef = doc(collection(firestore, `users/${user.uid}/inventory`), editItem.originalName);
      const newDocRef = doc(collection(firestore, `users/${user.uid}/inventory`), editItem.name);

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

      await updateInventory(user.uid);
      handleEditClose();
    } else {
      console.error('Cannot update item: Item name is empty or user is not logged in');
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
    if (!user) {
      console.error('Cannot import: User is not logged in');
      return;
    }

    const rows = importData.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const items = rows.slice(1).map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header.trim()] = row[index].trim();
      });
      return item;
    });

    // Get all current items
    const snapshot = await getDocs(collection(firestore, `users/${user.uid}/inventory`));
    const currentItems = new Set(snapshot.docs.map(doc => doc.id));

    // Add or update items from CSV
    for (const item of items) {
      if (!item.name) continue; // Skip items without a name
      const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item.name);
      await setDoc(docRef, {
        name: item.name,
        quantity: parseInt(item.quantity) || 0,
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        supplier: item.supplier || ''
      });
      currentItems.delete(item.name); // Remove from set of current items
    }

    // Delete items not in the CSV
    for (const itemName of currentItems) {
      await deleteDoc(doc(firestore, `users/${user.uid}/inventory`, itemName));
    }

    await updateInventory(user.uid);
    handleImportClose();
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

  const itemChartData = {
    labels: inventory.map(item => item.name),
    datasets: [{
      data: inventory.map(item => item.quantity),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      ],
    }],
  }

  const supplierChartData = {
    labels: [...new Set(inventory.map(item => item.supplier || 'N/A'))],
    datasets: [{
      data: [...new Set(inventory.map(item => item.supplier || 'N/A'))].map(supplier =>
        inventory.filter(item => (item.supplier || 'N/A') === supplier)
          .reduce((sum, item) => sum + item.quantity, 0)
      ),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      ],
    }],
  }

  const expenseChartData = {
    labels: inventory.map(item => item.name),
    datasets: [{
      data: inventory.map(item => item.price * item.quantity),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      ],
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Inventory Distribution',
      },
    },
  };

  const expenseChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Inventory Value Distribution',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
            }
            return label;
          }
        }
      }
    },
  };

  const deleteItem = async (item) => {
    if (!item || !user) {
      console.error('Cannot delete item: Item is invalid or user is not logged in');
      return;
    }

    const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item.name);
    try {
      await deleteDoc(docRef);
      console.log('Item deleted successfully');
      await updateInventory(user.uid);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }

  if (!user) {
    return null // or a loading spinner
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          background: 'linear-gradient(45deg, #000000, #1a1a1a)',
          pt: 4,
          pb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography 
                variant="h2" 
                fontWeight="bold" 
                align="center" 
                gutterBottom
                sx={{
                  animation: `${glowKeyframes} 2s ease-in-out infinite`,
                  color: '#ffffff',
                }}
              >
                Void Inventory
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Card elevation={3} sx={{ background: theme.palette.background.paper }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Welcome, {user.displayName}</Typography>
                    <Button variant="outlined" onClick={handleSignOut}>Sign Out</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ background: theme.palette.background.paper }}>
                <CardContent>
                  <Typography variant="h4" gutterBottom>Inventory Analysis</Typography>
                  <Tabs value={chartTab} onChange={(e, newValue) => setChartTab(newValue)}>
                    <Tab label="By Item" />
                    <Tab label="By Supplier" />
                    <Tab label="By Value" />
                  </Tabs>
                  <Box sx={{ height: "400px", mt: 2 }}>
                    {chartTab === 0 ? (
                      <Pie data={itemChartData} options={chartOptions} />
                    ) : chartTab === 1 ? (
                      <Pie data={supplierChartData} options={chartOptions} />
                    ) : (
                      <Pie data={expenseChartData} options={expenseChartOptions} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ background: theme.palette.background.paper }}>
                <CardContent>
                  <Typography variant="h4" gutterBottom>Actions</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>Add New Item</Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button fullWidth variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportToCSV}>Export to CSV</Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button fullWidth variant="outlined" startIcon={<FileUploadIcon />} onClick={handleImportOpen}>Import from CSV</Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card elevation={3} sx={{ background: theme.palette.background.paper }}>
                <CardContent>
                  <Typography variant="h4" gutterBottom>Inventory Items</Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
                  <Grid container spacing={2} sx={{ maxHeight: "600px", overflow: "auto" }}>
                    {filteredAndSortedInventory.map((item) => (
                      <Grid item xs={12} sm={6} md={4} key={item.name}>
                        <Card 
                          variant="outlined" 
                          sx={{
                            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                            },
                          }}
                        >
                          <CardContent>
                            <Typography variant="h6">{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description ? item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '') : 'No description'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Price: ${item.price ? item.price.toFixed(2) : 'N/A'} | Supplier: {item.supplier || 'N/A'}
                            </Typography>
                            <Typography variant="h6" align="center" mt={2}>{item.quantity}</Typography>
                          </CardContent>
                          <CardActions>
                            <IconButton color="primary" onClick={() => incrementItem(item)}><AddIcon /></IconButton>
                            <IconButton color="secondary" onClick={() => removeItem(item)}><RemoveIcon /></IconButton>
                            <IconButton color="info" onClick={() => handleEditOpen(item)}><EditIcon /></IconButton>
                            <IconButton color="error" onClick={() => deleteItem(item)}><DeleteIcon /></IconButton>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Modal open={open} onClose={handleClose}>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              width={400}
              bgcolor={theme.palette.background.paper}
              border={`2px solid ${theme.palette.primary.main}`}
              boxShadow={24}
              p={4}
              display="flex"
              flexDirection="column"
              gap={3}
              sx={{
                transform: 'translate(-50%, -50%)',
                borderRadius: '8px',
              }}
            >
              <Typography variant="h5" color="primary">Add Item</Typography>
              <TextField
                label="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                variant="outlined"
                fullWidth
                InputLabelProps={{
                  style: { color: theme.palette.text.secondary }
                }}
                InputProps={{
                  style: { color: theme.palette.text.primary }
                }}
              />
              <TextField
                label="Quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                variant="outlined"
                fullWidth
                InputLabelProps={{
                  style: { color: theme.palette.text.secondary }
                }}
                InputProps={{
                  style: { color: theme.palette.text.primary }
                }}
              />
              <TextField
                label="Description"
                multiline
                rows={3}
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                variant="outlined"
                fullWidth
                InputLabelProps={{
                  style: { color: theme.palette.text.secondary }
                }}
                InputProps={{
                  style: { color: theme.palette.text.primary }
                }}
              />
              <TextField
                label="Price"
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                variant="outlined"
                fullWidth
                InputLabelProps={{
                  style: { color: theme.palette.text.secondary }
                }}
                InputProps={{
                  style: { color: theme.palette.text.primary }
                }}
              />
              <TextField
                label="Supplier"
                value={newItem.supplier}
                onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                variant="outlined"
                fullWidth
                InputLabelProps={{
                  style: { color: theme.palette.text.secondary }
                }}
                InputProps={{
                  style: { color: theme.palette.text.primary }
                }}
              />
              <Button 
                variant="contained" 
                onClick={addItem}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
              >
                Add
              </Button>
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
        </Container>
      </Box>
    </ThemeProvider>
  )
}