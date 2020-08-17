const apiEndpoint = {
	BASEURL: 'https://hacker-news.firebaseio.com/v0/'
}
let pageNo = 1;
let paginationSet = 0;
let catergoryType = 'topstories';
const categories = [{
	type: 'topstories',
	label: 'Top',
	selected: true
}, {
	type: 'newstories',
	label: 'New',
	selected: false
}, {
	type: 'beststories',
	label: 'Best',
	selected: false
}, {
	type: 'askstories',
	label: 'Ask',
	selected: false
}, , {
	type: 'showstories',
	label: 'Show',
	selected: false
}, , {
	type: 'jobstories',
	label: 'Job',
	selected: false
}];
const loaderContainer = document.getElementById('loaderContainer');
const cardsContainer = document.getElementById('cardsContainer');
const pageNoText = document.getElementById('pageNoText');
pageNoText.innerHTML = pageNo;
populateCategoriesPanel();
setSelectedCategoryStyle();
fetchNews('topstories');
function populateCategoriesPanel() {
	categories.forEach(category => {
		const categoryEle = document.createElement('DIV');
		categoryEle.id = category.label;
		categoryEle.classList.add('category');
		categoryEle.innerHTML = category.label;
		categoryEle.onclick = () => {
			pageNo = 1;
			catergoryType = category.type;
			markCategorySelected(category.type);
			fetchNews();
		};
		const categoryContainer = document.getElementById('categoryContainer');
		categoryContainer.appendChild(categoryEle);
	})
}
function nextPageClicked() {
	pageNo++;
	pageNoText.innerHTML = pageNo;
	fetchNews();
}
function previousPageClicked() {
	pageNo--;
	pageNoText.innerHTML = pageNo;
	fetchNews();
}
function setBtnDisability(type, isDisabled) {
	const btn = document.getElementById(type + 'Btn');
	btn.style.pointerEvents = isDisabled ? 'none' : 'visible';
	btn.style.color = isDisabled ? '#a6a6a6' : 'white';
}
function fetchNews() {
	cardsContainer.style.display = "none";
	loaderContainer.style.display = "flex";
	const getStoriesListRequest = new XMLHttpRequest();
	getStoriesListRequest.addEventListener('load', processList);
	getStoriesListRequest.open('GET', apiEndpoint.BASEURL + catergoryType + '.json');
	getStoriesListRequest.send();
}
function processList(event) {
	const mainList = JSON.parse(event.currentTarget.response);
	paginationSet = Math.floor(mainList.length / 30);
	const batchIds = getBatchIds(mainList);
	const batches = formBatches();
	const currentBatch = batches['page' + pageNo];
	setPaginationBtnState();
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
	loaderContainer.style.display = "none";
	cardsContainer.innerHTML = '';
	cardsContainer.style.display = "block";
	items.forEach((item) => {
		if (item && Object.keys(item).length) {
			const card = document.createElement('DIV');
			card.classList.add('card');
			const cardTitle = document.createElement('H3');
			cardTitle.classList.add('cardTitle');
			const detailsConatiner = document.createElement('DIV');
			detailsConatiner.classList.add('detailsContainer');
			const hoursAgo = createHoursAgoDiv(item);
			cardTitle.innerHTML = item.title;
			card.appendChild(cardTitle);
			detailsConatiner.appendChild(hoursAgo);
			if (item['kids'] && item['kids'].length) {
				const commentsDiv = createCommentsDiv(item['kids'].length);
				detailsConatiner.appendChild(commentsDiv);
			}
			card.appendChild(detailsConatiner);
			cardsContainer.appendChild(card);
			cardsContainer.onclick = () => {
				if (item.url) {
					window.open(item.url, '_blank');
				}
			}
		}
	});
}
function createCommentsDiv(count) {
	const commentsDiv = document.createElement('DIV');
	commentsDiv.setAttribute('class', 'commentsDiv');
	const faIcon = document.createElement('i')
	faIcon.setAttribute('class', 'fa fa-comments-o commentIcon');
	const commentCount = document.createElement('p');
	commentCount.setAttribute('class', 'commentCount')
	commentCount.innerHTML = count;
	commentsDiv.appendChild(faIcon);
	commentsDiv.appendChild(commentCount);
	return commentsDiv;
}
function createHoursAgoDiv(item) {
	const hoursAgoDiv = document.createElement('DIV');
	hoursAgoDiv.setAttribute('class', 'hoursAgoDiv');
	const faIcon = document.createElement('i')
	faIcon.setAttribute('class', 'fa fa-clock-o clockIcon');
	const hoursAgoValue = document.createElement('p');
	hoursAgoValue.setAttribute('class', 'hoursAgoValue')
	hoursAgoValue.innerHTML = timeToHoursAgo(item.time);
	hoursAgoDiv.appendChild(faIcon);
	hoursAgoDiv.appendChild(hoursAgoValue);
	return hoursAgoDiv;
}
function timeToHoursAgo(ts) {
	var currentDate = new Date();
	var nowTs = Math.floor(currentDate.getTime() / 1000);
	var seconds = nowTs - ts;
	if (seconds > 2 * 24 * 3600) {
		return "Few days ago";
	}
	if (seconds > 24 * 3600) {
		return "Yesterday";
	}
	if (seconds > 3600) {
		return "Few hours ago";
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
function formBatches() {
	const batches = {};
	for (let i = 1; i <= paginationSet; i++) {
		batches['page' + i] = {
			items: [],
			promises: {},
			promiseStatusList: []
		}
	}
	return batches;
}
function getBatchIds(mainList) {
	return pageNo === mainList.length / 30
		? mainList.slice(pageNo * 30)
		: mainList.slice(pageNo * 30, (pageNo * 30) + 30);
}
function setPaginationBtnState() {
	if (pageNo === 1) {
		setBtnDisability('next', false);
		setBtnDisability('previous', true);
		return;
	}
	else if (pageNo === paginationSet) {
		setBtnDisability('next', true);
		setBtnDisability('previous', false);
		return;
	}
	setBtnDisability('next', false);
	setBtnDisability('previous', false);
	return;
}
function setSelectedCategoryStyle() {
	categories.forEach(category => {
		const categoryEle = document.getElementById(category.label);
		categoryEle.style.border = category.selected ? '6px solid #4db8ff' : '6px solid #e6f5ff';
	})
}
function markCategorySelected(catergoryType) {
	categories.forEach(category => {
		if (category.type === catergoryType) {
			category.selected = true;
		} else {
			category.selected = false;
		}
	});
	setSelectedCategoryStyle();
}
