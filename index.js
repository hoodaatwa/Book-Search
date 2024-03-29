    // Function to fetch suggestions from Google Books API
    function fetchGoogleBooksSuggestions(query) {
        const script = document.createElement('script');
        script.src = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&callback=handleGoogleBooksResponse`;
        document.body.appendChild(script);
    }

    // Callback function to handle Google Books API response
    function handleGoogleBooksResponse(response) {
        const suggestionsDiv = document.getElementById('suggestions');

        // Clear existing suggestions
        suggestionsDiv.innerHTML = '';

        // Display suggestions
        if (response.items && response.items.length > 0) {
            response.items.forEach(item => {
                const title = item.volumeInfo.title;

                const li = document.createElement('li');
                li.textContent = title;
                li.addEventListener('click', () => {
                    document.getElementById('bookQuery').value = title;
                    suggestionsDiv.innerHTML = '';
                });
                suggestionsDiv.appendChild(li);

                // If Google results are found, hide pagination
                document.getElementById('pagination').style.display = 'none';
            });
        } else {
            // If no Google results, show pagination
            document.getElementById('pagination').style.display = 'flex';
        }
    }

    // Function to fetch suggestions while typing
    function showSuggestions() {
        const query = document.getElementById('bookQuery').value;

        // Clear existing suggestions
        document.getElementById('suggestions').innerHTML = '';

        // Fetch and display suggestions
        if (query.trim() !== '') {
            fetchGoogleBooksSuggestions(query);
        }
    }

    // Function to fetch data from Open Library API
    function fetchOpenLibraryData(query, page = 1) {
        return fetch(`https://openlibrary.org/search.json?q=${query}&page=${page}&limit=10`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching Open Library data:', error);
                throw error;
            });
    }

    // Function to fetch data from both Open Library and Google Books APIs
    async function fetchData(query, page = 1) {
        // Hide suggestions
        document.getElementById('suggestions').innerHTML = '';

        // Show loading spinner
        document.getElementById('loadingSpinner').style.display = 'inline';

        // Clear existing data
        document.getElementById('bookData').innerHTML = '';
        document.getElementById('pagination').innerHTML = ''; // Clear existing pagination

        try {
            // Fetch data from Open Library
            const openLibraryData = await fetchOpenLibraryData(query, page);

            // Check if there are any works in the Open Library response
            if (openLibraryData.docs && openLibraryData.docs.length > 0) {
                // Process the Open Library data and update the HTML content
                displayBookData(openLibraryData);

                // Add pagination if more than 10 results
                if (openLibraryData.numFound > 10) {
                    displayPagination(openLibraryData, page);
                }
            } else {
                // If no results from Open Library, try fetching data from Google Books API
                fetchGoogleBooksSuggestions(query);
                fetchGoogleBooksData(query);
            }
        } catch (error) {
            // Handle errors from Open Library API
            document.getElementById('bookData').innerHTML = '<p>Error fetching data. Please try again later.</p>';
        } finally {
            // Hide loading spinner after data is loaded
            document.getElementById('loadingSpinner').style.display = 'none';
        }
    }

    // Function to fetch data from Google Books API
    function fetchGoogleBooksData(query) {
        fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                // Process the Google Books data and update the HTML content
                displayGoogleBooksData(data);
            })
            .catch(error => {
                console.error('Error fetching Google Books data:', error);
                document.getElementById('bookData').innerHTML = '<p>Error fetching data from Google Books. Please try again later.</p>';
            });
    }

    // Function to display Google Books data in HTML
    function displayGoogleBooksData(data) {
        const bookDataDiv = document.getElementById('bookData');

        // Check if there are any items in the response
        if (data.items && data.items.length > 0) {
            // Process and display information for each book
            data.items.forEach(item => {
                const title = item.volumeInfo.title;
                const coverImageURL = item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : '';
                const rating = item.volumeInfo.averageRating ? item.volumeInfo.averageRating : 'Not rated';
                const description = item.volumeInfo.description ? item.volumeInfo.description : 'No description available';
                const pageCount = item.volumeInfo.pageCount || 'Not available';
                const authors = item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author';
                const categories = item.volumeInfo.categories ? item.volumeInfo.categories.join(', ') : 'Not available';
                const publishedDate = item.volumeInfo.publishedDate || 'Not available';
                const language = item.volumeInfo.language || 'Not available';
                const previewLink = item.volumeInfo.previewLink || '#';

                // Check if any data is '0', 'Not available', or 'Unknown', and exclude those lines
                const bookInfo = `
                    <h2>${title}</h2>
                    <img src="${coverImageURL}" alt="Book Cover" style="max-width: 200px; max-height: 300px;">
                    <p>Rating:</p> ${rating} 
                    <p>Description: <br> ${description}</p>
                    <p>Page Count: ${pageCount}</p>
                    <p>Authors: ${authors}</p>
                    <p>Categories: ${categories}</p>
                    <p>Published Date: ${publishedDate}</p>
                    <p>Language: ${language}</p>
                    <a href="${previewLink}" target="_blank">Preview Link</a>
                `;

                // Append the book info to the HTML content
                bookDataDiv.innerHTML += bookInfo;


// Display Goodreads widget for each book
            bookDataDiv.innerHTML += `
              <br>
Goodreads search for<a rel="nofollow" href="https://www.goodreads.com/search?q=${encodeURIComponent(title)}" target="_blank"> ${title}</a>                
                <br>
            `;



                bookDataDiv.innerHTML += `<hr style="height: 5px; background-color: #f8f8f8; margin: 0;border: none;">`;
            });
        } else {
            // Display a message if no results are found from Google Books
            bookDataDiv.innerHTML = '<p>No results found from Google Books.</p>';
        }
    }

// Function to display book data in HTML with Goodreads integration
    async function displayBookData(data) {
        const bookDataDiv = document.getElementById('bookData');

        // Keep track of displayed titles to avoid duplicates
        const displayedTitles = new Set();

        // Display information for each book in the results
        for (const book of data.docs) {
            const title = book.title;

            // Skip displaying if the title is already in the set
            if (displayedTitles.has(title)) {
                continue;
            }

            displayedTitles.add(title);

            const ratingsAverage = book.ratings_average || 'Not available';
            const coverEditionKey = book.cover_edition_key || 'Not available';
            const coverImageURL = `https://covers.openlibrary.org/b/olid/${coverEditionKey}-M.jpg`; // Construct cover image URL
            const editionCount = book.edition_count || 'Not available';
            const authorName = book.author_name ? book.author_name.join(', ') : 'Unknown Author';
            const time = book.time ? book.time.join(', ') : 'Not available';
            const hasFullText = book.has_fulltext || false;
            const titleSuggest = book.title_suggest || 'Not available';
            const publishYear = book.publish_year ? book.publish_year[0] : 'Unknown';
            const language = book.language ? book.language[0] : 'Unknown';
            const numberOfPagesMedian = book.number_of_pages_median || 'Not available';
            const firstPublishYear = book.first_publish_year || 'Unknown';

            // Fetch data from Google Books API for the Preview Link
            const googleBooksData = await fetchGoogleBooksDataByTitle(title);

            // Extract Preview Link from Google Books API response
            const previewLink = googleBooksData?.items?.[0]?.volumeInfo?.previewLink || '#';

            // Check if any data is '0', 'Not available', or 'Unknown', and exclude those lines
            const bookInfo = `
                <h2>${title}</h2>
                
                <img src="${coverImageURL}" alt="Book Cover" style="max-width: 200px; max-height: 300px;">
                <p>Ratings Average:</p> ${ratingsAverage}
                <p>Edition Count: ${editionCount}</p>
                <p>Author: ${authorName}</p>
                <p>Time: ${time}</p>
                <p>Has Full Text: ${hasFullText}</p>
                <p>Title Suggest: ${titleSuggest}</p>
                <p>Publish Year: ${publishYear}</p>
                <p>Language: ${language}</p>
                <p>Number of Pages Median: ${numberOfPagesMedian}</p>
                <p>First Publish Year: ${firstPublishYear}</p>
                <p>Preview Link: <a href="${previewLink}" target="_blank">Google Books</a></p>
            `;

            // Append the book info to the HTML content
            bookDataDiv.innerHTML += bookInfo;
            

            // Display Goodreads widget for each book
            bookDataDiv.innerHTML += `
Goodreads search for<a rel="nofollow" href="https://www.goodreads.com/search?q=${encodeURIComponent(title)}" target="_blank"> ${title}</a>                <br>
            `;
       
            bookDataDiv.innerHTML += `<hr style="height: 5px; background-color: #f8f8f8; margin: 0;border: none;">`;
        }
    }

    // Function to fetch data from Google Books API by book title
    function fetchGoogleBooksDataByTitle(title) {
        return fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=1`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching Google Books data by title:', error);
                return null;
            });
    }

    // Function to display pagination
function displayPagination(data, currentPage) {
    const paginationDiv = document.getElementById('pagination');

    // Show pagination only if there are more than 10 results
    if (data.numFound > 10) {
        paginationDiv.style.display = 'flex';

        const totalPages = Math.ceil(data.numFound / 10); // Assuming 10 results per page

        // Clear existing pagination
        paginationDiv.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.textContent = i;
            li.addEventListener('click', () => {
                fetchData(document.getElementById('bookQuery').value, i);
                // Show suggestions when pagination is clicked
                showSuggestions();
            });

            if (i === currentPage) {
                li.style.fontWeight = 'bold';
            }

            paginationDiv.appendChild(li);
        }
    } else {
        // If there are 10 or fewer results, hide pagination
        paginationDiv.style.display = 'none';
    }
}


    // Function to trigger the search based on user input
function searchBook() {
    const bookQuery = document.getElementById('bookQuery').value;

    // Show suggestions
    showSuggestions();

    // Fetch data
    fetchData(bookQuery);
}

    const currentPageLocation = window.location.href;
    let displayedRepos = 0; // Counter for displayed repositories

    // Fetch data from GitHub API
    fetch('https://api.github.com/users/hoodaatwa/repos')
      .then(response => response.json())
      .then(data => {
        // Create Material-UI card for each repository
        const repoList = document.getElementById('repoList');
        data.forEach(repo => {
          if (displayedRepos >= 4 || repo.homepage === currentPageLocation) {
            // Skip creating card if reached the limit or homepage matches current page location
            return;
          }

          const repoCard = document.createElement('div');
          repoCard.classList.add('repoCard');
          repoCard.innerHTML = `
            <div class="repoTitle">${repo.name}</div>
            <div class="repoDescription">${repo.description}</div>
            <div class="repoLink">
              <a href="${repo.homepage}" target="_blank">Homepage <i class="fas fa-external-link-alt"></i></a>
            </div>
          `;
          repoList.appendChild(repoCard);

          displayedRepos++;
        });

        // Find the "Main" repository and create a special card with a dynamic link
        const mainRepo = data.find(repo => repo.name.toLowerCase() === 'main');
        if (mainRepo) {
          const mainRepoCard = document.createElement('div');

          mainRepoCard.innerHTML = `
            <a class="center" href="${mainRepo.homepage}" target="_blank">Go to Main Page <i class="fas fa-external-link-alt"></i></a>
          `;
          repoList.appendChild(mainRepoCard);
        }
      })
      .catch(error => console.error('Error fetching data:', error));

    function toggleMenu() {
      const menuOverlay = document.getElementById('menuOverlay');
      const body = document.body;
      const menuIcon = document.getElementById('menuIcon');

      if (menuOverlay.style.display === 'block') {
        menuOverlay.style.display = 'none';
        body.style.overflow = 'auto';
        menuIcon.classList.replace('fa-times', 'fa-bars');
      } else {
        menuOverlay.style.display = 'block';
        body.style.overflow = 'hidden';
        menuIcon.classList.replace('fa-bars', 'fa-times');
      }
    }
