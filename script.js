// 국가 플래그 이미지 URL 생성 함수
function getCountryFlagUrl(code) {
  // flagcdn.com 사용 (무료, 안정적)
  // 영국은 'uk' 코드를 사용하지만 flagcdn.com에서는 'gb'를 사용
  const flagCode = code === 'uk' ? 'gb' : code;
  return `https://flagcdn.com/w40/${flagCode}.png`;
}

// 허용된 국가 코드 목록
const ALLOWED_COUNTRIES = [
  { code: 'kr', name: '대한민국' },
  { code: 'vn', name: '베트남' },
  { code: 'jp', name: '일본' },
  { code: 'th', name: '태국' },
  { code: 'us', name: '미국' },
  { code: 'es', name: '스페인' },
  { code: 'fr', name: '프랑스' },
  { code: 'de', name: '독일' },
  { code: 'ca', name: '캐나다' },
  { code: 'au', name: '호주' },
  { code: 'nl', name: '네덜란드' },
  { code: 'sg', name: '싱가폴' },
  { code: 'id', name: '인도네시아' },
  { code: 'my', name: '말레이시아' },
  { code: 'tw', name: '대만' },
  { code: 'in', name: '인도' },
  { code: 'mx', name: '멕시코' },
  { code: 'uk', name: '영국' },
  { code: 'ru', name: '러시아' },
  { code: 'pt', name: '포르투갈' },
  { code: 'sa', name: '사우디' },
];

const COUNTRY_CODES = ALLOWED_COUNTRIES.map(c => c.code);

// URL 파싱 및 검증
function parseTripUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // trip.com 도메인인지 확인
    if (!urlObj.hostname.endsWith('.trip.com') && urlObj.hostname !== 'trip.com') {
      return { isValid: false };
    }
    
    // xx.trip.com 형태인지 확인
    const hostParts = urlObj.hostname.split('.');
    if (hostParts.length < 3 || hostParts[hostParts.length - 2] !== 'trip') {
      return { isValid: false };
    }
    
    // 국가 코드 추출
    const countryCode = hostParts[0];
    
    // 허용된 국가 코드인지 확인
    if (!COUNTRY_CODES.includes(countryCode)) {
      return { isValid: false };
    }
    
    // path와 query string 추출
    const path = urlObj.pathname;
    const queryString = urlObj.search;
    
    return {
      isValid: true,
      countryCode,
      path,
      queryString,
      fullUrl: url,
    };
  } catch (error) {
    return { isValid: false };
  }
}

// 국가 코드를 변경한 새로운 URL 생성
function generateCountryUrl(originalUrl, newCountryCode) {
  if (!originalUrl.isValid || !originalUrl.path) {
    return '';
  }
  
  const baseUrl = `https://${newCountryCode}.trip.com${originalUrl.path}`;
  const queryString = originalUrl.queryString || '';
  
  return baseUrl + queryString;
}

// 최근 검색 관련 함수들
const STORAGE_KEY = 'tripfinder_recent_searches';
const MAX_RECENT_SEARCHES = 6;

function getRecentSearches() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const searches = JSON.parse(stored);
    return searches.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    return [];
  }
}

function addRecentSearch(url) {
  try {
    const searches = getRecentSearches();
    
    // 중복 제거 (같은 URL이 있으면 제거)
    const filtered = searches.filter(s => s.url !== url);
    
    // 새로운 검색 추가
    const newSearches = [
      { url, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENT_SEARCHES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSearches));
  } catch (error) {
    console.error('Failed to save recent search:', error);
  }
}

function clearRecentSearches() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear recent searches:', error);
  }
}

// DOM 요소 참조
const logo = document.getElementById('logo');
const urlInput = document.getElementById('url-input');
const inputForm = document.getElementById('input-form');
const errorPopupOverlay = document.getElementById('error-popup-overlay');
const errorClose = document.getElementById('error-close');
const errorHelpButton = document.getElementById('error-help-button');
const errorContactButton = document.getElementById('error-contact-button');
const recentSearchesDiv = document.getElementById('recent-searches');
const recentSearchesList = document.getElementById('recent-searches-list');
const recentClear = document.getElementById('recent-clear');
const resultsDiv = document.getElementById('results');
const urlList = document.getElementById('url-list');
const helpModalOverlay = document.getElementById('help-modal-overlay');
const helpModalClose = document.getElementById('help-modal-close');
const menuHelp = document.getElementById('menu-help');
const menuDiscount = document.getElementById('menu-discount');
const menuTips = document.getElementById('menu-tips');
const menuContact = document.getElementById('menu-contact');
const principleButton = document.getElementById('principle-button');
const principlePopupOverlay = document.getElementById('principle-popup-overlay');
const principlePopupClose = document.getElementById('principle-popup-close');
const discountModalOverlay = document.getElementById('discount-modal-overlay');
const discountModalClose = document.getElementById('discount-modal-close');

// 최근 검색 렌더링
function renderRecentSearches() {
  const searches = getRecentSearches();
  
  if (searches.length === 0) {
    recentSearchesDiv.style.display = 'none';
    return;
  }
  
  recentSearchesDiv.style.display = 'block';
  recentSearchesList.innerHTML = '';
  
  searches.forEach((search) => {
    const displayInfo = extractDisplayInfo(search.url);
    const item = document.createElement('button');
    item.className = 'recent-search-item';
    item.innerHTML = `
      <div class="recent-search-content">
        <span class="recent-search-icon">${displayInfo.icon}</span>
        <div class="recent-search-info">
          <span class="recent-search-text">${escapeHtml(displayInfo.text)}</span>
          <span class="recent-search-time">${new Date(search.timestamp).toLocaleString('ko-KR')}</span>
        </div>
      </div>
    `;
    item.addEventListener('click', () => {
      handleRecentSearchSelect(search.url);
    });
    recentSearchesList.appendChild(item);
  });
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// URL에서 표시할 정보 추출
function extractDisplayInfo(url) {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const path = urlObj.pathname.toLowerCase();
    
    // 항공권인지 확인
    if (path.includes('flight') || path.includes('flights')) {
      const dcity = params.get('dcity');
      const acity = params.get('acity');
      const ddate = params.get('ddate');
      const rdate = params.get('rdate');
      const triptype = params.get('triptype');
      
      if (dcity && acity) {
        const cityNames = {
          'osa': '오사카', 'sel': '서울', 'icn': '인천', 'nrt': '나리타', 'hnd': '하네다',
          'bkk': '방콕', 'sin': '싱가포르', 'hkg': '홍콩', 'tpe': '타이베이', 'pvg': '상하이',
          'pek': '베이징', 'nrt': '나리타', 'kix': '간사이', 'fuk': '후쿠오카', 'cts': '삿포로',
          'dps': '발리', 'kul': '쿠알라룸푸르', 'bom': '뭄바이', 'del': '델리', 'dxb': '두바이',
          'lax': '로스앤젤레스', 'jfk': '뉴욕', 'sfo': '샌프란시스코', 'lhr': '런던', 'cdg': '파리',
          'fra': '프랑크푸르트', 'ams': '암스테르담', 'mad': '마드리드', 'fco': '로마', 'ath': '아테네'
        };
        
        const origin = cityNames[dcity.toLowerCase()] || dcity.toUpperCase();
        const destination = cityNames[acity.toLowerCase()] || acity.toUpperCase();
        
        let dateInfo = '';
        if (ddate) {
          const depDate = formatDate(ddate);
          if (triptype === 'rt' && rdate) {
            const retDate = formatDate(rdate);
            dateInfo = ` ${depDate}~${retDate}`;
          } else {
            dateInfo = ` ${depDate}`;
          }
        }
        
        return {
          type: 'flight',
          icon: '✈️',
          text: `${origin} - ${destination}${dateInfo}`
        };
      }
    }
    
    // 호텔인지 확인
    if (path.includes('hotel') || path.includes('hotels')) {
      const cityId = params.get('cityId');
      const cityName = params.get('cityName');
      const checkin = params.get('checkin');
      const checkout = params.get('checkout');
      
      if (cityId || cityName) {
        const city = cityName || `도시 ID: ${cityId}`;
        let dateInfo = '';
        if (checkin && checkout) {
          dateInfo = ` ${formatDate(checkin)}~${formatDate(checkout)}`;
        }
        return {
          type: 'hotel',
          icon: '🏨',
          text: `${city} 호텔${dateInfo}`
        };
      }
    }
    
    // 기본값: URL의 경로만 표시
    const pathParts = path.split('/').filter(p => p);
    if (pathParts.length > 0) {
      return {
        type: 'other',
        icon: '🔗',
        text: pathParts[pathParts.length - 1] || 'Trip.com'
      };
    }
    
    return {
      type: 'other',
      icon: '🔗',
      text: 'Trip.com'
    };
  } catch (error) {
    return {
      type: 'other',
      icon: '🔗',
      text: 'Trip.com'
    };
  }
}

// 날짜 포맷팅 (YYYY-MM-DD -> MM/DD)
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  } catch (error) {
    return dateStr;
  }
}

// 최근 검색 선택 처리
function handleRecentSearchSelect(url) {
  urlInput.value = url;
  const parsed = parseTripUrl(url);
  if (parsed.isValid) {
    const urls = ALLOWED_COUNTRIES
      .filter(country => country.code !== parsed.countryCode)
      .map(country => ({
        code: country.code,
        name: country.name,
        url: generateCountryUrl(parsed, country.code),
      }));
    renderResults(urls, url);
    hideError();
  } else {
    showError();
    hideResults();
  }
}

// 클릭한 URL 저장 (sessionStorage 사용 - 탭 닫으면 초기화)
const CLICKED_URLS_KEY = 'tripfinder_clicked_urls';

function getClickedUrls() {
  try {
    const stored = sessionStorage.getItem(CLICKED_URLS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function addClickedUrl(url) {
  try {
    const clicked = getClickedUrls();
    if (!clicked.includes(url)) {
      clicked.push(url);
      sessionStorage.setItem(CLICKED_URLS_KEY, JSON.stringify(clicked));
    }
  } catch (error) {
    console.error('Failed to save clicked URL:', error);
  }
}

// 결과 렌더링
function renderResults(urls, originalUrl) {
  if (urls.length === 0) {
    hideResults();
    return;
  }
  
  resultsDiv.style.display = 'block';
  
  // URL 타입에 따라 subtitle 변경
  const displayInfo = extractDisplayInfo(originalUrl);
  const resultsSubtitle = document.querySelector('.results-subtitle');
  
  // 돋보기 이모지 제거를 위한 클래스 제거
  resultsSubtitle.classList.remove('has-icon');
  
  if (displayInfo.type === 'hotel') {
    // 호텔인 경우
    const cityName = displayInfo.text.split(' 호텔')[0];
    resultsSubtitle.textContent = `🏨 현재 조회하고 있는 ${cityName}의 호텔의 최저가 링크를 확인해보세요!`;
  } else if (displayInfo.type === 'flight') {
    // 항공권인 경우
    const route = displayInfo.text.split(' ')[0]; // "오사카 - 서울" 부분만 추출
    resultsSubtitle.textContent = `✈️ 현재 조회하고 있는 ${route} 항공편의 최저가 링크를 확인해보세요!`;
  } else {
    // 기타 (기존 텍스트)
    resultsSubtitle.textContent = '국가 버튼을 눌러 가격을 확인해보세요';
    resultsSubtitle.classList.add('has-icon');
  }
  
  const clickedUrls = getClickedUrls();
  urlList.innerHTML = '';
  
  urls.forEach((item) => {
    const urlItem = document.createElement('a');
    const isClicked = clickedUrls.includes(item.url);
    urlItem.className = isClicked ? 'url-item clicked' : 'url-item';
    urlItem.href = item.url;
    urlItem.target = '_blank';
    urlItem.rel = 'noopener noreferrer';
    const flagUrl = getCountryFlagUrl(item.code);
    urlItem.innerHTML = `
      <img src="${flagUrl}" alt="${escapeHtml(item.name)}" class="country-flag" onerror="this.style.display='none'">
      <span class="country-name">${escapeHtml(item.name)}</span>
    `;
    
    // 클릭 이벤트 추가
    urlItem.addEventListener('click', () => {
      addClickedUrl(item.url);
      // 클릭한 항목에 클래스 추가
      urlItem.classList.add('clicked');
    });
    
    urlList.appendChild(urlItem);
  });
}

// 결과 숨기기
function hideResults() {
  resultsDiv.style.display = 'none';
}

// 오류 표시
function showError() {
  errorPopupOverlay.style.display = 'flex';
}

// 오류 숨기기
function hideError() {
  errorPopupOverlay.style.display = 'none';
}

// URL 복사
function handleCopyUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    // 복사 성공 (선택적으로 피드백 추가 가능)
  }).catch(() => {
    // 복사 실패 시 대체 방법
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  });
}

// 폼 제출 처리
inputForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const inputUrl = urlInput.value.trim();
  
  if (!inputUrl) {
    return;
  }

  const parsed = parseTripUrl(inputUrl);
  
  if (!parsed.isValid) {
    showError();
    hideResults();
    return;
  }

  // 유효한 URL인 경우 최근 검색에 추가
  addRecentSearch(inputUrl);
  renderRecentSearches();

  // 모든 국가별 URL 생성
  const urls = ALLOWED_COUNTRIES
    .filter(country => country.code !== parsed.countryCode) // 원본 국가 제외
    .map(country => ({
      code: country.code,
      name: country.name,
      url: generateCountryUrl(parsed, country.code),
    }));

  renderResults(urls, inputUrl);
  hideError();
});

// 오류 팝업 닫기
errorClose.addEventListener('click', () => {
  hideError();
});

// 오류 팝업에서 사용방법 보기
errorHelpButton.addEventListener('click', () => {
  hideError();
  showHelpModal();
});

// 문의하기 버튼
errorContactButton.addEventListener('click', () => {
  window.location.href = 'mailto:qq5466@naver.com';
});

// 최근 검색 지우기
recentClear.addEventListener('click', () => {
  if (window.confirm('최근 검색 기록을 모두 삭제하시겠습니까?')) {
    clearRecentSearches();
    renderRecentSearches();
  }
});

// 키보드 접근성
recentClear.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    recentClear.click();
  }
});

// 키보드 접근성
recentClear.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    recentClear.click();
  }
});

// 도움말 모달 단계 관리
let currentHelpStep = 1;
const totalHelpSteps = 4;

function updateHelpStep(step) {
  currentHelpStep = step;
  
  // 모든 단계 숨기기
  document.querySelectorAll('.help-step').forEach((stepEl, index) => {
    stepEl.classList.remove('active');
    if (index + 1 === step) {
      stepEl.classList.add('active');
    }
  });
  
  // 인디케이터 업데이트
  document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
    indicator.classList.remove('active');
    if (index + 1 === step) {
      indicator.classList.add('active');
    }
  });
  
  // 페이지 인디케이터 업데이트
  document.getElementById('help-current-page').textContent = step;
  
  // 버튼 상태 업데이트
  const prevButton = document.getElementById('help-prev-button');
  const nextButton = document.getElementById('help-next-button');
  
  prevButton.disabled = step === 1;
  nextButton.disabled = step === totalHelpSteps;
}

// 도움말 모달 표시
function showHelpModal() {
  helpModalOverlay.style.display = 'flex';
  updateHelpStep(1); // 첫 단계로 리셋
}

// 도움말 모달 숨기기
function hideHelpModal() {
  helpModalOverlay.style.display = 'none';
}

// 헤더 메뉴 클릭 이벤트
menuHelp.addEventListener('click', (e) => {
  e.preventDefault();
  showHelpModal();
});

// 할인코드 모달 표시
function showDiscountModal() {
  discountModalOverlay.style.display = 'flex';
  
  // 로딩 효과 표시
  const loadingDiv = document.getElementById('discount-loading');
  const resultsDiv = document.getElementById('discount-results');
  
  loadingDiv.style.display = 'flex';
  resultsDiv.style.display = 'none';
  
  // 2-3초 후 결과 표시 (검색 효과)
  const loadingTime = 2000 + Math.random() * 1000; // 2-3초 사이 랜덤
  
  setTimeout(() => {
    loadingDiv.style.display = 'none';
    resultsDiv.style.display = 'block';
  }, loadingTime);
}

// 할인코드 모달 숨기기
function hideDiscountModal() {
  discountModalOverlay.style.display = 'none';
}

menuDiscount.addEventListener('click', (e) => {
  e.preventDefault();
  showDiscountModal();
});

menuTips.addEventListener('click', (e) => {
  e.preventDefault();
  // 나중에 팁 페이지로 이동 예정
  alert('알아두면 좋은 팁 페이지 준비 중입니다.');
});

menuContact.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'mailto:qq5466@naver.com';
});

// 트립닷컴 스캐너 작동방식 팝업
principleButton.addEventListener('click', () => {
  principlePopupOverlay.style.display = 'flex';
});

principlePopupClose.addEventListener('click', () => {
  principlePopupOverlay.style.display = 'none';
});

principlePopupOverlay.addEventListener('click', (e) => {
  if (e.target === principlePopupOverlay) {
    principlePopupOverlay.style.display = 'none';
  }
});

// 도움말 모달 닫기 버튼
helpModalClose.addEventListener('click', () => {
  hideHelpModal();
});

// 도움말 모달 오버레이 클릭 시 닫기
helpModalOverlay.addEventListener('click', (e) => {
  if (e.target === helpModalOverlay) {
    hideHelpModal();
  }
});

// 할인코드 모달 닫기 버튼
discountModalClose.addEventListener('click', () => {
  hideDiscountModal();
});

// 할인코드 모달 오버레이 클릭 시 닫기
discountModalOverlay.addEventListener('click', (e) => {
  if (e.target === discountModalOverlay) {
    hideDiscountModal();
  }
});

// 할인코드 제보 버튼
const discountReportButton = document.getElementById('discount-report-button');
discountReportButton.addEventListener('click', () => {
  window.location.href = 'mailto:qq5466@naver.com?subject=할인코드 제보';
});

// 도움말 모달 네비게이션
const helpPrevButton = document.getElementById('help-prev-button');
const helpNextButton = document.getElementById('help-next-button');

helpPrevButton.addEventListener('click', () => {
  if (currentHelpStep > 1) {
    updateHelpStep(currentHelpStep - 1);
  }
});

helpNextButton.addEventListener('click', () => {
  if (currentHelpStep < totalHelpSteps) {
    updateHelpStep(currentHelpStep + 1);
  }
});

// 단계 인디케이터 클릭 이벤트
document.querySelectorAll('.step-indicator').forEach((indicator) => {
  indicator.addEventListener('click', () => {
    const step = parseInt(indicator.getAttribute('data-step'));
    updateHelpStep(step);
  });
});

// 오류 팝업 오버레이 클릭 시 닫기
errorPopupOverlay.addEventListener('click', (e) => {
  if (e.target === errorPopupOverlay) {
    hideError();
  }
});

// 오류 팝업 오버레이 클릭 시 닫기
errorPopupOverlay.addEventListener('click', (e) => {
  if (e.target === errorPopupOverlay) {
    hideError();
  }
});

// 로고 클릭 시 홈으로 이동
logo.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  urlInput.value = '';
  hideResults();
  hideError();
});

// 페이지 로드 시 최근 검색 표시
document.addEventListener('DOMContentLoaded', () => {
  renderRecentSearches();
});

