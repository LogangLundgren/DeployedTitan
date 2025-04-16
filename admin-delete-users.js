// Admin script to delete all users except Logan Main (ID 9)
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const LOGAN_MAIN_ID = 9; // ID of the Logan Main account to preserve
const ADMIN_SESSION_COOKIE = ''; // This would need to be filled with a valid session cookie for Logan Main

// Function to get all users
async function getAllUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: {
        'Cookie': ADMIN_SESSION_COOKIE
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Function to delete a user
async function deleteUser(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': ADMIN_SESSION_COOKIE
      }
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Failed to delete user ${userId}: ${response.status} ${response.statusText} - ${responseText}`);
    }
    
    const result = await response.json();
    console.log(`Successfully deleted user ${userId} (${result.username})`);
    return true;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    return false;
  }
}

// Main function to run the user cleanup
async function cleanupUsers() {
  console.log('Starting user cleanup process...');
  console.log(`Preserving Logan Main account (ID: ${LOGAN_MAIN_ID})`);
  
  // Get all users
  const users = await getAllUsers();
  
  if (!users.length) {
    console.log('No users found or failed to fetch users.');
    return;
  }
  
  console.log(`Found ${users.length} users.`);
  
  // Filter users to delete (exclude Logan Main)
  const usersToDelete = users.filter(user => user.id !== LOGAN_MAIN_ID);
  
  console.log(`Found ${usersToDelete.length} users to delete.`);
  
  // Delete each user
  let successCount = 0;
  let failCount = 0;
  
  for (const user of usersToDelete) {
    console.log(`Deleting user ${user.id} (${user.username})...`);
    const success = await deleteUser(user.id);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Add a small delay between requests to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nUser cleanup completed:');
  console.log(`- Successfully deleted: ${successCount} users`);
  console.log(`- Failed to delete: ${failCount} users`);
  console.log(`- Preserved: Logan Main (ID: ${LOGAN_MAIN_ID})`);
}

// Run the cleanup process
cleanupUsers().then(() => {
  console.log('Process completed.');
}).catch(error => {
  console.error('An error occurred during the cleanup process:', error);
});