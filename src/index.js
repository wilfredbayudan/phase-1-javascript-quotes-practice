document.addEventListener('DOMContentLoaded', () => {
  
  const dbUrl = 'http://localhost:3000';
  
  const quoteList = document.querySelector('#quote-list');
  
  const newForm = document.querySelector('#new-quote-form');

  const editModal = document.querySelector('#edit-modal');

  const cancelEditBtn = document.querySelector('#cancel-edit');
  
  let currentEditId = false;
  let currentEditNode = false;

  const editForm = document.querySelector('#edit-form');


  // Initial Fetch & Render
  fetchQuotes();

  // Handle New Quote Form Event
  newForm.addEventListener('submit', e => {
    e.preventDefault();

    const inputQuote = document.querySelector('input[name="quote"]').value;
    const inputAuthor = document.querySelector('input[name="author"]').value;

    postQuote(inputQuote, inputAuthor);

    newForm.reset();
  })

  // Handle Edits
  const inputQuoteEdit = document.querySelector('#edit-quote');
  const inputAuthorEdit = document.querySelector('#edit-author');
  cancelEditBtn.addEventListener('click', () => editModal.classList.remove('active'));

  editForm.addEventListener('submit', e => {
    e.preventDefault();
    submitEdit(currentEditId, inputQuoteEdit.value, inputAuthorEdit.value);
  })

  function submitEdit(id, quote, author) {
    
    if (id) {
      const patchConfig = {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          quote, author
        })
      };
  
      fetch(`${dbUrl}/quotes/${id}`, patchConfig)
        .then(res => res.json())
        .then(updated => {
          editForm.reset();
          editModal.classList.remove('active');

          currentEditNode.querySelector('p').textContent = updated.quote;
          currentEditNode.querySelector('footer').textContent = updated.author;
        })
        .catch(err => console.log(err));
  
      currentEditId = false;
    } else {
      console.log(`No Quote ID provided to edit.`)
    }
  }

  function renderEdit(id, quote, author, node) {
    currentEditId = id;
    currentEditNode = node;
    editModal.classList.add('active');

    inputQuoteEdit.value = quote;
    inputAuthorEdit.value = author;
  }

  // Post form to DB
  function postQuote(quote, author) {
    
    const postConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ quote, author })
    }

    fetch(`${dbUrl}/quotes`, postConfig)
      .then(res => res.json())
      .then(data => renderQuote(data, true))
      .catch(err => console.log(err))

  }

  // Fetch quote function
  function fetchQuotes() {
    // Reset 
    quoteList.textContent = '';
    fetch(`${dbUrl}/quotes/?_embed=likes`)
      .then(res => res.json())
      .then(data => data.forEach(quote => renderQuote(quote)))
      .catch(err => console.log(`Error: ${err}`))
      
  }

  // Function delete quote
  async function deleteQuote(id) {

    const deleteConfig = {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ id })
    }

    return fetch(`${dbUrl}/quotes/${id}`, deleteConfig)

  }

  // Like quote
  async function likeQuote(id) {

    const createdAt = Date.now();

    const likeConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        quoteId: id,
        createdAt
      })
    }

    return fetch(`${dbUrl}/likes`, likeConfig)

  }

  // Render quotes to list
  function renderQuote(quote, isNew = false) {

      const id = parseInt(quote.id);

      const li = document.createElement('li');
      li.setAttribute('id', quote.id);
      li.className = 'quote-card';
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'blockquote';
      const p = document.createElement('p');
      p.className = 'mb-0';
      p.textContent = quote.quote;
      const footer = document.createElement('footer');
      footer.className = 'blockquote-footer';
      footer.textContent = quote.author;
      const br = document.createElement('br');
      const btnSuccess = document.createElement('button');
      const span = document.createElement('span');
      span.textContent = isNew ? 0 : quote.likes.length;
      btnSuccess.className = 'btn btn-success';
      btnSuccess.textContent = 'Likes: ';
      btnSuccess.addEventListener('click', () => {
        likeQuote(id)
          .then(() => {
            // Update like count on DOM
            currentCount = parseInt(span.textContent);
            span.textContent = ++currentCount;
          })
          .catch(err => console.log(err));
      })
      const btnDanger = document.createElement('button');
      btnDanger.className = 'btn btn-danger';
      btnDanger.textContent = 'DELETE';
      btnDanger.addEventListener('click', () => {
        deleteQuote(id)
          .then(() => {
            li.remove();
          })
          .catch(err => console.log(err));
      })
      const btnEdit = document.createElement('button');
      btnEdit.setAttribute('class', 'btn btn-warning');
      btnEdit.textContent = 'EDIT';

      btnSuccess.appendChild(span);
      blockquote.appendChild(p);
      blockquote.appendChild(footer)
      blockquote.appendChild(br);
      blockquote.appendChild(btnSuccess);
      blockquote.appendChild(btnEdit);
      blockquote.appendChild(btnDanger);
      li.appendChild(blockquote);

      
      quoteList.appendChild(li);

      btnEdit.addEventListener('click', e => {
        renderEdit(quote.id, p.textContent, footer.textContent, li)
      });


  }

  // Client Side Sort
  let sortOn = false;

  function sort() {
    sortOn = !sortOn;
    const quotes = quoteList.querySelectorAll('li');
    let liArr;
    if (sortOn) {
      liArr = [].slice.call(quotes).sort(function (a, b) {
        return a.querySelector('footer').textContent > b.querySelector('footer').textContent ? 1 : -1;
      });
      btnSort.textContent = 'Sort by ID';
    } else {
      liArr = [].slice.call(quotes).sort(function (a, b) {
        return parseInt(a.id) > parseInt(b.id) ? 1 : -1;
      });
      btnSort.textContent = 'Sort by Author';
    }
    // Reset and reorder
    quoteList.textContent = '';
    liArr.forEach(function (p) {
      quoteList.appendChild(p);
    });
  }

  btnSort = document.getElementById('sort');
  btnSort.addEventListener('click', sort);

})