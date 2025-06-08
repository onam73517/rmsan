class WorkSchedule {
    constructor() {
        this.currentDate = new Date();
        this.teams = ['1팀', '2팀', '3팀', '4팀'];
        // 기본 근무 순서 (2024년 1월 1일 기준: 1팀 주간, 2팀 야간)
        this.baseShiftOrder = [0, 1, 2, 3]; // 0:주간, 1:야간, 2:휴무, 3:비번
        this.selectedTeam = null;
        this.holidays = {
            '1-1': '신정',
            '3-1': '삼일절',
            '5-5': '어린이날',
            '6-6': '현충일',
            '8-15': '광복절',
            '10-3': '개천절',
            '10-9': '한글날',
            '12-25': '크리스마스'
        };
        this.memoData = {};
        this.loadMemoFromLocalStorage();
        this.loadShiftOrderFromLocalStorage(); // 근무 순서 로드
        this.initializeCalendar();
        this.setupEventListeners();
    }

    initializeCalendar() {
        this.updateMonthDisplay();
        this.renderCalendar();
        this.updateShiftOrderDisplay(); // 설정 모달에 현재 근무 순서 표시
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.initializeCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.initializeCalendar();
        });

        document.querySelectorAll('.team-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const teamNumber = e.target.getAttribute('data-team');
                this.toggleTeamHighlight(teamNumber);
            });
        });

        // 메모 관련 이벤트 리스너
        const memoModal = document.getElementById('memoModal');
        const memoSaveBtn = document.querySelector('.memo-save');
        const memoCancelBtn = document.querySelector('.memo-cancel');
        const closeMemoBtn = document.querySelector('.close-memo');

        memoSaveBtn.addEventListener('click', () => this.saveMemo());
        memoCancelBtn.addEventListener('click', () => this.closeMemoModal());
        closeMemoBtn.addEventListener('click', () => this.closeMemoModal());

        memoModal.addEventListener('click', (e) => {
            if (e.target === memoModal) {
                this.closeMemoModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && memoModal.classList.contains('show')) {
                this.closeMemoModal();
            }
        });

        window.addEventListener('beforeunload', () => this.saveMemoToLocalStorage());

        // 근무 순서 설정 모달 관련 이벤트 리스너
        const settingModal = document.getElementById('settingModal');
        const settingButton = document.getElementById('shiftOrderSettingBtn');
        const closeSettingBtn = document.querySelector('.close-setting');
        const settingCloseBtn = document.querySelector('.setting-close');
        const rotateShiftOrderBtn = document.getElementById('rotateShiftOrder');

        settingButton.addEventListener('click', () => this.openSettingModal());
        closeSettingBtn.addEventListener('click', () => this.closeSettingModal());
        settingCloseBtn.addEventListener('click', () => this.closeSettingModal());
        rotateShiftOrderBtn.addEventListener('click', () => this.rotateShiftOrder());

        settingModal.addEventListener('click', (e) => {
            if (e.target === settingModal) {
                this.closeSettingModal();
            }
        });
    }

    toggleTeamHighlight(teamNumber) {
        document.querySelectorAll('.team-button').forEach(btn => {
            btn.classList.remove('active');
        });

        if (this.selectedTeam !== teamNumber) {
            this.selectedTeam = teamNumber;
            document.querySelector(`.team-button[data-team="${teamNumber}"]`).classList.add('active');
        } else {
            this.selectedTeam = null;
        }

        this.renderCalendar();
    }

    updateMonthDisplay() {
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        document.getElementById('currentMonth').textContent = 
            `${this.currentDate.getFullYear()}년 ${monthNames[this.currentDate.getMonth()]}`;
    }

    // 근무 순서 계산 로직 수정
    getTeamSchedule(date) {
        const baseDate = new Date(2024, 0, 1); // 기준일: 2024년 1월 1일 (월요일)
        const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
        const cycleDay = ((diffDays % 4) + 4) % 4; // 0, 1, 2, 3

        // 현재 baseShiftOrder 배열을 기반으로 주간/야간 팀 찾기
        const dayTeamIndex = this.baseShiftOrder.findIndex(pos => 
            ((pos + cycleDay) % 4) === 0 // 0:주간
        );
        const nightTeamIndex = this.baseShiftOrder.findIndex(pos => 
            ((pos + cycleDay) % 4) === 1 // 1:야간
        );

        return {
            day: this.teams[dayTeamIndex],
            night: this.teams[nightTeamIndex]
        };
    }

    // 팀 상태 계산 로직 수정
    getTeamStatus(date, teamNumber) {
        const baseDate = new Date(2024, 0, 1);
        const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
        const cycleDay = ((diffDays % 4) + 4) % 4;
        
        const teamStartPosition = this.baseShiftOrder.indexOf(parseInt(teamNumber) - 1); // 현재 팀의 근무 순서상 위치
        const currentPosition = (teamStartPosition + cycleDay) % 4;

        switch (currentPosition) {
            case 0: return '주간';
            case 1: return '야간';
            case 2: return '휴무';
            case 3: return '비번';
        }
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const startingDayOfWeek = firstDayOfMonth.getDay(); // 현재 월의 1일이 시작하는 요일 (0:일, 6:토)
        const daysInMonth = lastDayOfMonth.getDate(); // 현재 월의 총 일수
        
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        // 이전 달의 날짜 대신 빈 셀 추가 (해당 월 1일이 시작하는 요일까지)
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDayElement = document.createElement('div');
            emptyDayElement.className = 'calendar-day empty-slot'; // 빈칸을 위한 클래스 추가
            calendarDays.appendChild(emptyDayElement);
        }
        
        // 현재 달의 날짜들
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(
                day,
                new Date(year, month, day)
            );
            calendarDays.appendChild(dayElement);
        }
        
        // 다음 달의 날짜 대신 빈 셀 추가 (총 42개 셀을 채우기 위함)
        const totalDaysRendered = startingDayOfWeek + daysInMonth;
        const remainingCells = 42 - totalDaysRendered; // 6주 * 7일 = 42
        
        for (let i = 0; i < remainingCells; i++) {
            const emptyDayElement = document.createElement('div');
            emptyDayElement.className = 'calendar-day empty-slot'; // 빈칸을 위한 클래스 추가
            calendarDays.appendChild(emptyDayElement);
        }
    }

    createDayElement(dayNumber, date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayOfWeek = date.getDay(); // 0:일, 6:토
        if (dayOfWeek === 0 || dayOfWeek === 6 || this.isHoliday(date)) {
            dayElement.classList.add('weekend');
        }
        
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = dayNumber;
        dayElement.appendChild(dateNumber);
        
        if (this.isHoliday(date)) {
            const holidayName = document.createElement('div');
            holidayName.className = 'holiday-name';
            holidayName.textContent = this.holidays[`${date.getMonth() + 1}-${date.getDate()}`];
            dayElement.appendChild(holidayName);
        }
        
        const shiftInfo = document.createElement('div');
        shiftInfo.className = 'shift-info';

        if (this.selectedTeam) {
            // 특정 팀 선택 시
            const status = this.getTeamStatus(date, this.selectedTeam);
            const statusDiv = this.createTeamStatus(date, this.selectedTeam, status);
            shiftInfo.appendChild(statusDiv);
        } else {
            // 모든 팀 일정 표시 (주간/야간 팀 번호만)
            const schedule = this.getTeamSchedule(date);
            const dateStr = date.toISOString().split('T')[0];

            // 주간 근무 팀 번호
            const dayShiftTeamNum = parseInt(schedule.day.charAt(0));
            const dayShift = document.createElement('div');
            dayShift.className = `day-shift team-${dayShiftTeamNum}`; // 팀 번호에 따라 색상 클래스 추가
            dayShift.textContent = `${dayShiftTeamNum}팀`; // 주간 텍스트 제거
            
            const dayMemoKey = `${dateStr}-${dayShiftTeamNum}-주간`;
            if (this.memoData[dayMemoKey]) {
                dayShift.classList.add('has-memo');
                const dayIndicator = document.createElement('span');
                dayIndicator.className = 'memo-indicator';
                dayShift.appendChild(dayIndicator);

                const dayTooltip = document.createElement('div');
                dayTooltip.className = 'memo-tooltip';
                dayTooltip.textContent = this.memoData[dayMemoKey];
                dayShift.appendChild(dayTooltip);
            }
            dayShift.addEventListener('click', () => {
                this.openMemoModal(dateStr, dayShiftTeamNum, '주간');
            });
            
            // 야간 근무 팀 번호
            const nightShiftTeamNum = parseInt(schedule.night.charAt(0));
            const nightShift = document.createElement('div');
            nightShift.className = `night-shift team-${nightShiftTeamNum}`; // 팀 번호에 따라 색상 클래스 추가
            nightShift.textContent = `${nightShiftTeamNum}팀`; // 야간 텍스트 제거
            
            const nightMemoKey = `${dateStr}-${nightShiftTeamNum}-야간`;
            if (this.memoData[nightMemoKey]) {
                nightShift.classList.add('has-memo');
                const nightIndicator = document.createElement('span');
                nightIndicator.className = 'memo-indicator';
                nightShift.appendChild(nightIndicator);

                const nightTooltip = document.createElement('div');
                nightTooltip.className = 'memo-tooltip';
                nightTooltip.textContent = this.memoData[nightMemoKey];
                nightShift.appendChild(nightTooltip);
            }
            nightShift.addEventListener('click', () => {
                this.openMemoModal(dateStr, nightShiftTeamNum, '야간');
            });
            
            shiftInfo.appendChild(dayShift);
            shiftInfo.appendChild(nightShift);
        }
        
        dayElement.appendChild(shiftInfo);
        return dayElement;
    }

    createTeamStatus(date, team, shift) {
        const dateStr = date.toISOString().split('T')[0];
        const memoKey = `${dateStr}-${team}-${shift}`;
        const hasMemo = this.memoData[memoKey];
        
        const statusDiv = document.createElement('div');
        // 'team-status' 클래스는 그대로 유지하되, '주간', '야간', '휴무', '비번' 클래스를 함께 사용
        statusDiv.className = `team-status ${shift}${hasMemo ? ' has-memo' : ''}`;
        statusDiv.textContent = shift; // "주간", "야간", "휴무", "비번" 텍스트는 그대로 유지
        
        const indicator = document.createElement('span');
        indicator.className = 'memo-indicator';
        statusDiv.appendChild(indicator);
        
        if (hasMemo) {
            const tooltip = document.createElement('div');
            tooltip.className = 'memo-tooltip';
            tooltip.textContent = this.memoData[memoKey];
            statusDiv.appendChild(tooltip);
        }
        
        statusDiv.addEventListener('click', () => {
            this.openMemoModal(dateStr, team, shift);
        });
        
        return statusDiv;
    }

    isHoliday(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return !!this.holidays[`${month}-${day}`];
    }

    // 메모 관련 메서드
    openMemoModal(date, team, shift) {
        this.currentMemoDate = date;
        this.currentMemoTeam = team;
        this.currentMemoShift = shift;
        
        const memoKey = `${date}-${team}-${shift}`;
        document.getElementById('memoText').value = this.memoData[memoKey] || '';
        
        document.getElementById('memoModal').classList.add('show');
    }

    closeMemoModal() {
        document.getElementById('memoModal').classList.remove('show');
        document.getElementById('memoText').value = '';
        this.currentMemoDate = null;
        this.currentMemoTeam = null;
        this.currentMemoShift = null;
    }

    saveMemo() {
        const memoKey = `${this.currentMemoDate}-${this.currentMemoTeam}-${this.currentMemoShift}`;
        const memoContent = document.getElementById('memoText').value.trim();
        
        if (memoContent) {
            this.memoData[memoKey] = memoContent;
        } else {
            delete this.memoData[memoKey];
        }
        
        this.saveMemoToLocalStorage();
        this.renderCalendar();
        this.closeMemoModal();
    }

    saveMemoToLocalStorage() {
        localStorage.setItem('calendarMemos', JSON.stringify(this.memoData));
    }

    loadMemoFromLocalStorage() {
        const savedMemos = localStorage.getItem('calendarMemos');
        if (savedMemos) {
            this.memoData = JSON.parse(savedMemos);
        }
    }

    // 근무 순서 설정 관련 메서드
    openSettingModal() {
        document.getElementById('settingModal').classList.add('show');
        this.updateShiftOrderDisplay();
    }

    closeSettingModal() {
        document.getElementById('settingModal').classList.remove('show');
    }

    rotateShiftOrder() {
        // baseShiftOrder 배열을 한 칸씩 뒤로 미룸 (순환)
        const lastElement = this.baseShiftOrder.pop();
        this.baseShiftOrder.unshift(lastElement);
        this.saveShiftOrderToLocalStorage();
        this.updateShiftOrderDisplay();
        this.renderCalendar(); // 달력 재렌더링
    }

    updateShiftOrderDisplay() {
        const shiftOrderDisplay = document.getElementById('shiftOrderDisplay');
        const currentOrderTeams = this.baseShiftOrder.map(index => `${index + 1}팀`);
        shiftOrderDisplay.textContent = `주간 ${currentOrderTeams[0]} / 야간 ${currentOrderTeams[1]} / 휴무 ${currentOrderTeams[2]} / 비번 ${currentOrderTeams[3]}`;
    }

    saveShiftOrderToLocalStorage() {
        localStorage.setItem('baseShiftOrder', JSON.stringify(this.baseShiftOrder));
    }

    loadShiftOrderFromLocalStorage() {
        const savedOrder = localStorage.getItem('baseShiftOrder');
        if (savedOrder) {
            this.baseShiftOrder = JSON.parse(savedOrder);
        }
    }
}

// 달력 초기화
new WorkSchedule();