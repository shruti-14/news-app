// This is just a simple sample code to show you the usage of the api
// Feel free to rewrite and improve or delete and start from scratch

const apiEndpoint = {
	BASEURL: 'https://hacker-news.firebaseio.com/v0/'
}
let pageNo = 1;
populateCategoriesPanel();
fetchNews('topstories');
function populateCategoriesPanel() {
	const categories = [{
		type: 'topstories',
		label: 'Top'
	}, {
		type: 'newstories',
		label: 'New'
	}, {
		type: 'beststories',
		label: 'Best'
	}, {
		type: 'askstories',
		label: 'Ask'
	}, , {
		type: 'showstories',
		label: 'Show'
	}, , {
		type: 'jobstories',
		label: 'Job'
	}];

	categories.forEach(category => {
		const categoryEle = document.createElement('DIV');
		categoryEle.class = 'category';
		categoryEle.innerHTML = category.label;
		categoryEle.onclick = () => fetchNews(category.type);
		const categoryContainer = document.getElementById('categoryContainer');
		categoryContainer.appendChild(categoryEle);
	})
}
function showNewsOnCategoryClicked(type) {
	fetchNews(type);
}
function nextPageClicked(type) {
	pageNo++;
	fetchNews(type);
}
function previousPageClicked(type) {
	pageNo--;
	fetchNews(type);
}
function fetchNews(type) {
	const getStoriesListRequest = new XMLHttpRequest();
	getStoriesListRequest.addEventListener('load', processList);
	getStoriesListRequest.open('GET', apiEndpoint.BASEURL + type + '.json');
	getStoriesListRequest.send();
}
function processList(event) {
	const mainList = JSON.parse(event.currentTarget.response);
	const noOfPages = Math.floor(mainList.length / 30);
	const batchIds = getBatchIds(pageNo, mainList);
	const batches = formBatches(noOfPages);
	const currentBatch = batches['page' + pageNo];
	batchIds.forEach(storyId => {
		currentBatch['promises']['Promise' + storyId] = new Promise((resolve, reject) => {
			const getSingleItemRequest = new XMLHttpRequest();
			const url = apiEndpoint.BASEURL + 'item/' + storyId + '.json';
			getSingleItemRequest.open('GET', url);
			getSingleItemRequest.onreadystatechange = function () {
				if (getSingleItemRequest.readyState === XMLHttpRequest.DONE
					&&
					getSingleItemRequest.status === 200) {
					resolve(JSON.parse(getSingleItemRequest.response));
					currentBatch['items'].push(JSON.parse(getSingleItemRequest.response));
				}
			}
			getSingleItemRequest.send();
		});
	});
	populatePromises(currentBatch);
	Promise.all(currentBatch['promiseStatusList']).then((values) => {
		console.log(currentBatch['items']);
		populateList(currentBatch['items']);
	});
}
function populateList(items) {
	const cardsCaontainer = document.getElementById('cardsContainer');
	items.forEach(item => {
		const card = document.createElement('DIV');
		const cardTitle = document.createElement('H1');
		const hoursAgo = document.createElement('P');
		const commentsDiv = document.createElement('P');
		hoursAgo.innerHTML = timeToHoursAgo(item.time);
		cardTitle.innerHTML = item.title;
		commentsDiv.innerHTML = item['kids'] && item['kids'].length > 0 ? item['kids'].length + ' Comments' : '';
		card.appendChild(cardTitle);
		card.appendChild(hoursAgo);
		card.appendChild(commentsDiv);
		cardsCaontainer.appendChild(card);
	});
}
function timeToHoursAgo(ts) {
	var currentDate = new Date();
	var nowTs = Math.floor(currentDate.getTime() / 1000);
	var seconds = nowTs - ts;
	// more that two days
	if (seconds > 2 * 24 * 3600) {
		return "a few days ago";
	}
	// a day
	if (seconds > 24 * 3600) {
		return "yesterday";
	}
	if (seconds > 3600) {
		return "a few hours ago";
	}
	if (seconds > 1800) {
		return "Half an hour ago";
	}
	if (seconds > 60) {
		return Math.floor(seconds / 60) + " minutes ago";
	}
}
function populatePromises(currentBatch) {
	Object.keys(currentBatch['promises']).forEach(promise => {
		currentBatch['promiseStatusList'].push(currentBatch['promises'][promise]);
	})
}
function formBatches(noOfPages) {
	const batches = {};
	for (let i = 0; i < noOfPages; i++) {
		batches['page' + i] = {
			items: [],
			promises: {},
			promiseStatusList: []
		}
	}
	return batches;
}
function getBatchIds(pageNo, mainList) {
	return pageNo === mainList.length / 30
		? mainList.slice(pageNo * 30)
		: mainList.slice(pageNo * 30, (pageNo * 30) + 30);
}
