/*jshint esversion: 6 */

var app = new Vue({
    el: '#app',
    vuetify: new Vuetify(),
    data: {
        mainPage: 'Home',
        totalVisitors: '9000',
        todaysDate: '',
        yesterdaysDate: '',
        currentTime: '',
        currentTemp: '',
        weatherImage: '',

        parkingCount: '50',

        Entrances: ['East',],
        entranceDisplay: '',
        entranceCount: '',
        entranceCountYesterday: '',
        entranceDateUpdated: '',
        entrancePeopleYesterday: 'N/A',
        entranceOutDisplay: 'N/A',

        statesTimes: ['By Hour', 'Yesterday', '24 Hour', '7 Day', '30 Day'],
        radarTimes: ['Monthly', 'Daily'],
        stateArrowImage: 'icons/downArrow.png',
        stateTimePage : 'By Hour',
        radarTimePage: 'Monthly',
        riverData: ['Hourly', 'Daily'],
        riverTimePage: 'Hourly',
        stateDateRange: [],
        DatePickerPopUp: false,
        eastStateURL: 'https://trailwaze.info/bryce/vehicleTrafficAvgPerHour.php',

        visitor_selected: true,
        overflow_selected: false,
        M_selected: false,
        ETI_selected: true, 
        ETO_selected: false,
        R_selected: false,
        S_selected: false, 
        D_selected: false,
        Ratio_selected: false,
        Month_selected: true,
        Day_selected: false,

        lightTraffic: true,
        mediumTraffic: false,
        heavyTraffic: false,
    },
    created: function () {
        this.getTodaysDate();
        this.getWeatherAPI();
        this.fetchData();
    },
    methods:{
        statRefresh: function () {
            this.fetchData();
            this.getWeatherAPI();
        },
        resetPages: function () {
            this.ETISelected();
            this.MonthSelected();
        },
        getAPIData_safe: function (data, fields, def){
			//data = json object api return data
			//fields = array of data fields tree
			//def = default return value if nothing is found
			var ret = def;
            var multiEntrance = false;
			try{
				if(i == 0 && tdata.hasOwnProperty(f + "1")){multiEntrance = true;}
				var tdata = data;
				for(var i = 0; i < fields.length; i++){
					let f = fields[i];
					if(tdata.hasOwnProperty(f)){
						if(i == fields.length - 1){
							ret = tdata[f];
						}else{
							tdata = tdata[f];
						}
					}
				}
			}catch(err){
				console.log(err);
			}
			return ret;
        },
        fetchData: function(){
            var vm = this;
            axios.get("https://trailwaze.info/bryce/request.php").then(response => {
                //Today
				vm.entranceCount = this.getAPIData_safe(response.data, ["BRCAEntranceLane1", "Today", "count"], 0);
                vm.entranceCount += this.getAPIData_safe(response.data, ["BRCAEntranceLane2", "Today", "count"], 0);
                vm.entranceCount += this.getAPIData_safe(response.data, ["BRCAEntranceLane3", "Today", "count"], 0);
				//Yesterday
                var entranceMultiplier = this.getAPIData_safe(response.data, ["BRCAEntranceLane1", "Yesterday", "multiplier"], 3);
                vm.entranceCountYesterday = this.getAPIData_safe(response.data, ["BRCAEntranceLane1", "Yesterday", "count"], 0);
                vm.entranceCountYesterday += this.getAPIData_safe(response.data, ["BRCAEntranceLane2", "Yesterday", "count"], 0);
                vm.entranceCountYesterday += this.getAPIData_safe(response.data, ["BRCAEntranceLane3", "Yesterday", "count"], 0);
                vm.entranceDateUpdated = this.getAPIData_safe(response.data, ["BRCAEntranceLane1", "Yesterday", "date"], "N/A");
                if(vm.entranceCount > 0){vm.entranceDisplay = vm.entranceCount + " vehicles | " + Math.round(vm.entranceCount * entranceMultiplier) + " visitors";}
                if(vm.entranceCountYesterday > 0){vm.entrancePeopleYesterday = Math.round(vm.entranceCountYesterday * entranceMultiplier);}

                var E = vm.entranceCount/5000;
                var O = 0.01;
                if (this.mainPage == "Home"){
                    this.loadHome(E);
                }
                if (this.mainPage == "Entrances"){
                    this.loadEntrances(E,O);
                }
            }).catch(error => {
                vm = "Fetch " + error;
            });
        },
        loadHome: function(E){
            this.setStop("line1", 47, E);
        },
        loadEntrances: function(E,O){
            if(this.ETI_selected == true){
                this.setStop("line2", 9, E);
            }else if(this.ETO_selected == true){
                this.setStop("line3", 9, O);
            }
        },
        setStop: function(id, radius, stop){
            var c = document.getElementById(id);
            c.className = "background";
            var stopVal = Math.PI * radius * 2 * (stop);
            c.setAttribute("stroke-dasharray", stopVal + ", 3000");
            c.setAttribute("stroke-dashoffset", stopVal);
            c.className = "overlayLine";
        },
        getTodaysDate: function () {
            var date = new Date();
            var yesterday = new Date(date);
            yesterday.setDate(yesterday.getDate()-1);
            var days = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

            var fulldate = days[date.getDay()] + ", " + months[date.getMonth()] + " " + date.getDate() + " " + date.getFullYear();
            this.todaysDate = fulldate;
            var yesterdayDate = days[yesterday.getDay()] + ", " + months[yesterday.getMonth()] + " " + yesterday.getDate() + " " + yesterday.getFullYear();
            this.yesterdaysDate = yesterdayDate;

            var hours = date.getHours();
            var time = "AM";
            if(hours > 12){
                hours -= 12;
                time = "PM";
            }
            var minutes = date.getMinutes();
            if (minutes<10){
                minutes = "0" + minutes;
            }
            this.currentTime = hours + ":" + minutes + time;
        },
        getWeatherAPI: function() {
			var vm = this;				
			axios.get("https://forecast.weather.gov/MapClick.php?lat=37.70128&lon=-112.14897&unit=0&lg=english&FcstType=dwml").then(response => {
				let parser = new DOMParser();
				let doc = parser.parseFromString(response.data, "text/xml");
				var currentWeather = doc.getElementsByTagName("data")[1];
				var temp = currentWeather.getElementsByTagName("temperature")[0];
				var tempVal = temp.getElementsByTagName("value")[0].childNodes[0].nodeValue;
				var icon = currentWeather.getElementsByTagName("icon-link")[0].childNodes[0].nodeValue;
                vm.currentTemp = tempVal;
				this.checkWeatherImage(icon);								 
			}).catch(error => {
                vm = "Fetch " + error;
            });
        },
        checkWeatherImage: function(icon){
            console.log("WeatherIcon", icon);
            if (icon == null || icon == "NULL" || icon == "null"){
                this.weatherImage = "icons/bison.svg";
                return;
            }
            const hours = new Date().getUTCHours();
			var timeOfDay = "weatherNight";
			if(hours <= 2 || (hours > 12 && hours < 24  )){
                timeOfDay = "weather";
            }
            icon = "./icons/"+ timeOfDay + icon.substr(icon.lastIndexOf("/")).replace(".png",".svg");
            this.weatherImage = icon;
            console.log("WeatherImage:", this.weatherImage);
        },
        loadTraffic: function(){
            axios.get("https://trailwaze.info/bryce/vehicleTraffic_request.php?site=eastin").then(response =>{
                var rotateNum = response.data.Array.rotate100;
                
                if(rotateNum < 33){
                    this.lightTraffic = true;
                    this.mediumTraffic = false;
                    this.heavyTraffic = false;
                }else if(rotateNum < 66){
                    this.lightTraffic = false;
                    this.mediumTraffic = true;
                    this.heavyTraffic = false;
                }else{
                    this.lightTraffic = false;
                    this.mediumTraffic = false;
                    this.heavyTraffic = true;
                }
                rotateNum /= 100;

                this.setStop("trafficLine", 47, rotateNum);

                
            }).catch(error =>{
                vm = "Fetch " + error;
            });
            
        },
        MSelected: function(){
            this.M_selected = true;
            this.ETO_selected = false;
            this.R_selected = false;
            this.ETI_selected = false;
            this.S_selected = false;
            this.Ratio_selected = false;
            this.D_selected = false;
        },
        ETISelected: function(){
            this.M_selected = false;
            this.ETO_selected = false;
            this.R_selected = false;
            this.ETI_selected = true;
            this.S_selected = false;
            this.Ratio_selected = false;
            this.D_selected = false;
        },
        ETOSelected: function(){
            this.M_selected = false;
            this.ETO_selected = true;
            this.R_selected = false;
            this.ETI_selected = false;
            this.S_selected = false;
            this.Ratio_selected = false;
            this.D_selected = false;
        },
        ratioSelected: function(){
            this.M_selected = false;
            this.Ratio_selected = true;
            this.ETO_selected = false;
            this.R_selected = false;
            this.ETI_selected = false;
            this.S_selected = false;
            this.D_selected = false;
        },
        RSelected: function(){
            this.M_selected = false;
            this.ETO_selected = false;
            this.R_selected = true;
            this.ETI_selected = false;
            this.S_selected = false;
            this.Ratio_selected = false;
            this.D_selected = false;
        },
        SSelected: function(){
            this.M_selected = false;
            this.ETO_selected = false;
            this.R_selected = false;
            this.ETI_selected = false;
            this.S_selected = true;
            this.Ratio_selected = false;
            this.D_selected = false;
        },
        DSelected: function(){
            this.M_selected = false;
            this.ETO_selected = false;
            this.R_selected = false;
            this.ETI_selected = false;
            this.S_selected = false;
            this.Ratio_selected = false;
            this.D_selected = true;
        },
        MonthSelected: function(){
            this.Month_selected = true;
            this.Day_selected = false;
        },
        DaySelected: function(){
            this.Month_selected = false;
            this.Day_selected = true;
        },
        resetRadarTabs: function(){
            this.radarTimePage = 'Monthly';
            this.eastRadarURL = '';
        },
        setEastRadarData: function(){
            switch(this.radarTimePage){
                case 'Monthly': this.eastRadarURL = ''; break;
                case 'Daily': this.eastRadarURL = ''; break;
            }
        },
        resetStateTabs: function() {
            this.stateTimePage = 'By Hour';
            this.eastStateURL = 'https://trailwaze.info/bryce/vehicleTrafficAvgPerHour.php';
        },
        setEastStateData: function() {
            switch(this.stateTimePage) {
                case 'By Hour': this.eastStateURL = 'https://trailwaze.info/bryce/vehicleTrafficAvgPerHour.php'; break;
                case 'Yesterday': this.eastStateURL = 'https://trailwaze.info/bryce/vehicleTrafficByState.php?interval=yesterday'; break;
                case '24 Hour': this.eastStateURL = 'https://trailwaze.info/bryce/vehicleTrafficByState.php?interval=1days'; break;
                case '7 Day': this.eastStateURL = 'https://trailwaze.info/bryce/vehicleTrafficByState.php?interval=7days'; break;
                case '30 Day': this.eastStateURL = 'https://trailwaze.info/bryce/vehicleTrafficByState.php?interval=30days'; break;
            }
        },
        switchArrow: function() {
            if(this.stateArrowImage == 'icons/downArrow.png'){
                this.stateArrowImage = 'icons/upArrow.png';
            } else{
                this.stateArrowImage = 'icons/downArrow.png';
            }
        },
        resetArrow: function() {
            this.stateArrowImage = 'icons/downArrow.png';
        },
        selectStateDates: function(entrance) {
            if( this.stateDateRange.length > 1) { // a range of days selected
                let year1 = this.stateDateRange[0].substr(0,4);
                let year2 = this.stateDateRange[1].substr(0,4);
                let month1 = this.stateDateRange[0].substr(5,2);
                let month2 = this.stateDateRange[1].substr(5,2);
                let day1 = this.stateDateRange[0].substr(8,2);
                let day2 = this.stateDateRange[1].substr(8,2);
                this.eastStateURL = `https://trailwaze.info/bryce/plates_by_state_date.php?date1=${year1}-${month1}-${day1}&date2=${year2}-${month2}-${day2}`;
                console.log(this.eastStateURL);
            }else if( this.stateDateRange.length == 1) { // just a single day selected
                let year1 = this.stateDateRange[0].substr(0,4);
                let month1 = this.stateDateRange[0].substr(5,2);
                let day1 = this.stateDateRange[0].substr(8,2);
                this.eastStateURL = `https://trailwaze.info/bryce/plates_by_state_date.php?date1=${year1}-${month1}-${day1}&date2=${year1}-${month1}-${day1}`;
                console.log(this.eastStateURL);
            } else{
                alert('No days were selected!');
            }
            this.stateDateRange = []; // reset calendar
        },
        closeDatePicker: function() {
            this.DatePickerPopUp = false;
        },
        openDatePicker: function() {
            this.DatePickerPopUp = true;
        },
        sleep: function(milliseconds) {
            var start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
              if ((new Date().getTime() - start) > milliseconds){
                break;
              }
            }
        },
    },
    computed: {
        dateRangeText () {
            return this.stateDateRange.join(' ~ ');
        }
    },
});