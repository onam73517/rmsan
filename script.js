class WorkSchedule {
    constructor() {
        this.currentDate = new Date();
        this.teams = ['1팀', '2팀', '3팀', '4팀'];
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
        this.loadShiftOrderFromLocalStorage();
        this.initializeCalendar();
        this.setupEventListeners();
    }

    initializeCalendar() {
        this.updateMonthDisplay();
        this.renderCalendar();
        this.updateShiftOrderDisplay();
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

    getTeamSchedule(date) {
        const baseDate = new Date(2024, 0, 1);
        const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
        const cycleDay = ((diffDays % 4) + 4) % 4;

        const dayTeamIndex = this.baseShiftOrder.findIndex(pos => 
            ((pos + cycleDay) % 4) === 0
        );
        const nightTeamIndex = this.baseShiftOrder.findIndex(pos => 
            ((pos + cycleDay) % 4) === 1
        );

        return {
            day: this.teams[dayTeamIndex],
            night: this.teams[nightTeamIndex]
        };
    }

    getTeamStatus(date, teamNumber) {
        const baseDate = new Date(2024, 0, 1);
        const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
        const cycleDay = ((diffDays % 4) + 4) % 4;
        
        const teamStartPosition = this.baseShiftOrder.indexOf(parseInt(teamNumber) - 1);
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
        
        const startingDayOfWeek = firstDayOfMonth.getDay();
        const daysInMonth = lastDayOfMonth.getDate();
        
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDayElement = document.createElement('div');
            emptyDayElement.className = 'calendar-day empty-slot';
            calendarDays.appendChild(emptyDayElement);
        }
        
        const today = new Date(); // 오늘 날짜를 가져옴
        
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDayDate = new Date(year, month, day);
            const dayElement = this.createDayElement(
                day,
                currentDayDate
            );
            // 오늘 날짜인 경우에만 today-highlight-blink 클래스 추가
            if (currentDayDate.toDateString() === today.toDateString()) {
                dayElement.classList.add('today-highlight-blink');
            }
            calendarDays.appendChild(dayElement);
        }
        
        const totalCellsFilled = startingDayOfWeek + daysInMonth;
        const remainingCells = (7 - (totalCellsFilled % 7)) % 7; 
        
        for (let i = 0; i < remainingCells; i++) {
            const emptyDayElement = document.createElement('div');
            emptyDayElement.className = 'calendar-day empty-slot';
            calendarDays.appendChild(emptyDayElement);
        }
    }

    createDayElement(dayNumber, date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6 || this.isHoliday(date)) {
            dayElement.classList.add('weekend');
        }
        
        // 이 부분은 오늘 날짜 테두리 깜빡임 기능으로 대체되므로 제거
        // const today = new Date();
        // if (date.toDateString() === today.toDateString()) {
        //     dayElement.classList.add('today');
        // }
        
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
            const status = this.getTeamStatus(date, this.selectedTeam);
            const statusDiv = this.createTeamStatus(date, this.selectedTeam, status);
            shiftInfo.appendChild(statusDiv);
        } else {
            const schedule = this.getTeamSchedule(date);
            const dateStr = date.toISOString().split('T')[0];

            const dayShiftTeamNum = parseInt(schedule.day.charAt(0));
            const dayShift = document.createElement('div');
            dayShift.className = `day-shift team-${dayShiftTeamNum}`;
            dayShift.textContent = `${dayShiftTeamNum}팀`;
            
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
            
            const nightShiftTeamNum = parseInt(schedule.night.charAt(0));
            const nightShift = document.createElement('div');
            nightShift.className = `night-shift team-${nightShiftTeamNum}`;
            nightShift.textContent = `${nightShiftTeamNum}팀`;
            
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
        statusDiv.className = `team-status ${shift}${hasMemo ? ' has-memo' : ''}`;
        statusDiv.textContent = shift;
        
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

    openSettingModal() {
        document.getElementById('settingModal').classList.add('show');
        this.updateShiftOrderDisplay();
    }

    closeSettingModal() {
        document.getElementById('settingModal').classList.remove('show');
    }

    rotateShiftOrder() {
        const lastElement = this.baseShiftOrder.pop();
        this.baseShiftOrder.unshift(lastElement);
        this.saveShiftOrderToLocalStorage();
        this.updateShiftOrderDisplay();
        this.renderCalendar();
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

new WorkSchedule();