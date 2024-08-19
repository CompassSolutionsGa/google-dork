document.getElementById('searchButton').addEventListener('click', function () {
    const domain = document.getElementById('domainInput').value.trim();
    const dorkType = document.getElementById('dorkType').value;

    if (domain) {
        checkPremiumAccess('user123', domain);  // Example user ID and domain
    } else {
        alert("Please enter a valid domain.");
    }
});

function fetchAndAnalyzeBacklinks(domain) {
    const query = `"${domain}" -site:${domain}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    fetch(url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');

            links.forEach(link => {
                analyzeLink(link, domain);
            });
        })
        .catch(error => console.error('Error fetching backlinks:', error));
}

function analyzeLink(link, domain) {
    const href = link.href;
    const anchorText = link.textContent;
    const relAttribute = link.getAttribute('rel');

    let isDofollow = true;
    if (relAttribute && relAttribute.includes('nofollow')) {
        isDofollow = false;
    }

    const analysisResult = {
        domain: domain,
        href: href,
        anchorText: anchorText,
        isDofollow: isDofollow,
    };

    displayAnalysisResult(analysisResult);
}

function calculateQualityScore(linkAnalysis) {
    let score = 0;

    if (linkAnalysis.anchorText.includes(linkAnalysis.domain)) {
        score += 20;
    }

    if (linkAnalysis.isDofollow) {
        score += 30;
    }

    if (linkAnalysis.href.includes(linkAnalysis.domain)) {
        score += 50;
    }

    return score;
}

function displayAnalysisResult(analysisResult) {
    const score = calculateQualityScore(analysisResult);
    const resultElement = document.createElement('div');
    resultElement.innerHTML = `
        <p><strong>Link:</strong> <a href="${analysisResult.href}" target="_blank">${analysisResult.href}</a></p>
        <p><strong>Anchor Text:</strong> ${analysisResult.anchorText}</p>
        <p><strong>Dofollow:</strong> ${analysisResult.isDofollow ? 'Yes' : 'No'}</p>
        <p><strong>Quality Score:</strong> ${score}</p>
    `;
    document.getElementById('analysisResults').appendChild(resultElement);
}

document.getElementById('subscribeButton').addEventListener('click', function() {
    var stripe = Stripe('pk_live_OHJfaLSbEJ1Fd4tqje1O7aIo00I3kVEQsT');
    stripe.redirectToCheckout({
        lineItems: [{
            price: 'price_1PpJp8J5tSEOEZFP5Lp9uiMY',
            quantity: 1
        }],
        mode: 'subscription',
        successUrl: 'https://compasssolutions.us/payment-success/',
        cancelUrl: 'https://compasssolutions.us/payment-canceled'
    }).then(function (result) {
        if (result.error) {
            alert(result.error.message);
        }
    });
});

function checkPremiumAccess(userId, domain) {
    fetch(`https://compasssolutionsga.github.io/google-dork/payment-status.json`)
        .then(response => response.json())
        .then(data => {
            if (data[userId] && data[userId].isPremium) {
                fetchAndAnalyzeBacklinks(domain);
            } else {
                alert("You need a premium subscription to access this feature.");
            }
        })
        .catch(error => console.error('Error:', error));
}

// Existing history functions
function getDateRange(range) {
    const now = new Date();
    let pastDate;
    switch(range) {
        case 'yesterday':
            pastDate = new Date(now.setDate(now.getDate() - 1));
            break;
        case 'week':
            pastDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            pastDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'year':
            pastDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            return '';
    }
    return pastDate.toISOString().split('T')[0];
}

window.onload = function() {
    displayHistory();
};

function displayHistory() {
    chrome.storage.sync.get({ searchHistory: [] }, function(data) {
        const searchHistoryList = document.getElementById('searchHistoryList');
        searchHistoryList.innerHTML = '';
        data.searchHistory.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.dorkType}: ${item.domain}`;
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'X';
            deleteButton.className = 'deleteButton';
            deleteButton.addEventListener('click', function () {
                deleteSearch(item.id);
            });

            li.appendChild(deleteButton);
            searchHistoryList.appendChild(li);
        });

        const container = document.getElementById('searchHistoryListContainer');
        if (data.searchHistory.length > 4) {
            container.style.overflowY = 'auto';
        } else {
            container.style.overflowY = 'hidden';
        }
    });
}

function deleteSearch(id) {
    chrome.storage.sync.get({ searchHistory: [] }, function(data) {
        const newHistory = data.searchHistory.filter(item => item.id !== id);
        chrome.storage.sync.set({ searchHistory: newHistory }, function() {
            displayHistory();
        });
    });
}

document.getElementById('clearAllButton').addEventListener('click', function () {
    chrome.storage.sync.set({ searchHistory: [] }, function() {
        displayHistory();
    });
});
