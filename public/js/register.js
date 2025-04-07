document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop the form from submitting normally (GET request)
  
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
  
    try {
      const res = await fetch('http://10.12.10.231:4000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, passwordConfirm })
      });
  
      const data = await res.json();
      console.log(data);
  
      if (res.ok) {
        alert('Registration successful!');
        // maybe redirect: window.location.href = '/login';
      } else {
        alert(data.message || 'Something went wrong!');
      }
  
    } catch (err) {
      console.error(err);
      alert('Request failed.');
    }
  });
  