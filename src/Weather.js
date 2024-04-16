import { createContext, useContext, forwardRef, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './styles.module.scss';
import Sun from './backgrounds/sun.jpg';
import Snow from './backgrounds/snow.jpg';
import Overcast from './backgrounds/overcast.jpg';
import LightRain from './backgrounds/rainsky.jpg';
import Broken from './backgrounds/broken.jpg';
import Fog from './backgrounds/fog.jpg';
import StartRain from './backgrounds/startWithRain.jpg';

const Context = createContext([null, null, null, null]);





function WeatherForm({ callback = getWeather }) {
    
    const [text, setText] = useState("");
    const [description, setDescription] = useState("");
    const [cityList, setList] = useState([]);
    const [narrow, setNarrow] = useState(window.innerWidth < 800);
    const [showList, setShow] = useState(false);
    const [req, setReq] = useState([]);// сохраненные запросы с нашего сервера
    const [count, setCount] = useState(0);
    const [image, setImage] = useState(StartRain);
    const [isHighSpeed, setHighSpeed] = useState(true);// достаточно ли высокая скорость чтоб подгружать данные с geonames
    const imgMood = description[2];// описание
    const cold = description[3] < 0;// температура

    
    useEffect(() => {
        const handleResize = () => {
          setNarrow(window.innerWidth < 800);
        };
    
        window.addEventListener('resize', handleResize);
    
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }, []);

    
    

    function uniquer(list) {
        return list.filter((fl, index) => list.indexOf(fl) === index);
    }
    


    const containerRef = useRef(null);
    useEffect(() => { if (imgMood) {
        if (cold) {
            setImage(Snow);
        }
        else if (imgMood.includes("overcast")) {
            setImage(Overcast);
        } else if (imgMood.includes("rain")) {
            setImage(LightRain);
        } else if (imgMood.includes("broken")) {
            setImage(Broken);
        }
            else if(imgMood.includes("fog")) {
                    setImage(Fog);
            }
         else setImage(Sun)
    }}, [imgMood, cold]);

    
    useEffect(() => {
        getServer();
    }, [count]);
    
    useEffect(() => {
        let finalList = [];
        let transText = transliterate(text);
        
        let filteredReq = req.filter(r => r.value.startsWith(transText) || r.value.startsWith(text));
        let isSaved = filteredReq.length > 0;
        
        
        if (isSaved && filteredReq.length < 1000) {
            let values = [];
            for (let fr of filteredReq) {
                values.push(fr.value);
            }
            values = values.slice(0, 3);
            finalList = [...values];
            
            
        };

        if (isHighSpeed) { // у пользователя достаточно быстрое соединение?
        
        startWithFromApi(transText).then(results => {
        if (text.length > 0) {
        let textText = transText[0].toUpperCase() + transText.slice(1); 
        finalList = [...finalList, ...results];
        finalList = finalList.slice(0, 5);
        finalList = finalList.filter(fl => fl.startsWith(transText) || fl.startsWith(textText));
        finalList = uniquer(finalList);
        setList(finalList);
        setShow(true);
        
        
        }
    })} else {
        finalList = uniquer(finalList);
        setList(finalList);
    }
       return () => {
        
        setShow(false);
        setList([]);
       }
       
      
    }, [text])

    
function getServer() {
        axios.get('http://localhost:8000/submissions')
  .then(response => { 
    setReq(response.data);// получаем с нашего сервера обновленный список запросов
    console.log("askFromServer");
  })
  .catch(error => {
    console.error('Ошибка при получении данных:', error);
  });

    }
    function postServer() {
        
        const obj = {value: text};
        axios.post(`http://localhost:8000/submit`, obj).then(res => {
            
        console.log("Отправлены данные на сервер", res.data);

    }).catch(err => console.log(err));

    }
    
    
    function weatherRequest(city) {
        const start = performance.now();
        callback(city).then(res => {
            setDescription(res);
        setText('');
        postServer();
        setCount(c => c + 1);
        const end = performance.now();
        const time = end - start;// во время каждого запроса проверяем скорость пользователя
        setHighSpeed(time < 800);
        console.log(time);

    })

        
        
        
        
        }

        function weatherRequestAdder(e) {
            e.preventDefault();
            weatherRequest(text);
            postServer(e);
            setShow(false);
            
            
    }

        
    function cityClick(e) {
        const content = e.target.textContent;
        weatherRequest(content);
        setShow(false);
        
    }

    function onInput(e) {
        setText(e.target.value);
        setDescription("");

    }


    function mouseoverFree() {
        setShow(true);// курсор над полем для ввода, значит, возвращаем выпадающий список
    }
    function containerOver(e) {
        if (e.target == containerRef.current) {// если под курсором нет более глубоко вложенных элементов, скрываем выпадающий список
            setShow(false);
        }
    }

    
    
    
    
    
    
    return (
        
            <Context.Provider value={[text, onInput, mouseoverFree]}>
                
                        <Container image={image} func={containerOver} ref={containerRef}>
                            <Form onSubmit={weatherRequestAdder} 
                             >
                                <List>
                                        {text.length > 0 && showList &&
                                            cityList.map((item, index) => (
                                                <CityBlock key={index} func={cityClick}
                                                 index={index} item={item}></CityBlock>
                                            ))
                                        }
                                    </List>
                        
                                <WeatherDescription narrow={narrow} func={() => setShow(false)}
                                letter={description[0]} temper={description[1]}
                                cloud={description[2]}>
                                </WeatherDescription>
                                <Button />
                            </Form>
                        </Container>
                    
            </Context.Provider>
        
    );
}




  
function transliterate(text) {
    const rusToLatMap = {
        "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i",
        "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
        "у": "u", "ф": "f", "х": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "'",
        "э": "e", "ю": "yu", "я": "ya"
    };

    return text.split('').map(char => rusToLatMap[char.toLowerCase()] || char).join('');
}










async function startWithFromApi(starts) {
    let arr = []; 
    starts = transliterate(starts);
    try {
        let res = await fetch(`https://api.geonames.org/searchJSON?featureCode=PPLA&name_startsWith=${starts}&maxRows=5&username=vovarama13`);
        if (!res.ok) {
            throw new Error("error");
        }
    let json = await res.json();
    for (let geo of json.geonames) {
        arr.push(geo.toponymName);
    }
    return arr;
} catch(err) {
    return ""
}
}

async function getWeather(city) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=3bb51a1bebe48592e6f27f16d2cd72e4`, {
            method: "GET"
        });

        if (!res.ok) {
            throw new Error("Fetch error");
        }
    
        const weather = await res.json();
        const letter = `Temperature is `;
        const celsium = weather.main.temp - 273.15;
        let temp = `${(celsium).toFixed(2)}°C`;
        if (celsium > 0) {
            temp = "+ " + temp;
            }
        const cloud = `Cloud is ${weather.weather[0].description}`;
        const arr = [letter, temp, cloud, celsium];
        console.log(cloud);

        return arr;
    } catch (err) {
        return ["City",'', "not found"];
    }
}

const Container = forwardRef(({ children, image, func }, ref) => {
    return (
        <div ref={ref} onMouseOver={func} className={styles.container} style={{backgroundImage: `url(${image})`}}>
            {children}
        </div>
    );
});

function Form({ children, onSubmit }) {
    
    return (
        <form onSubmit={onSubmit}  className={styles.formStyle} action="">
                <LabelInput   />
                    {children}
                </form>
    )
}

function LabelInput( ) {
    const [text, onInput, onMouseOver, onMouseOut] = useContext(Context);
    return (
        <div className={styles.righter}>
                    <label  htmlFor="city">Weather in city:   </label>
                    <input className={styles.inputStyle} onChange={onInput}  
                    onMouseOver={onMouseOver} onMouseOut={onMouseOut}
                     value={text} type="text" id="city" name="city" 
                     autoComplete="off"></input>
                     </div>
    )
}




function CityBlock({ func, index, item }) {
    return (
        <div onClick={func} key={index} className={styles.innerlist} style={{ marginTop: `${index * 20}px` }}>
            {item}
        </div>
    );
}

function List({ children }) {
    return <div className={styles.list}>{children}</div>;
}

function WeatherDescription({ func, letter, temper, cloud, narrow}) {
    return (<div onMouseOver={func}  className={styles.weatherDescription}>{letter}<span style={{fontWeight: "bold"}}>{temper}</span>{!narrow && <br></br>}
                {cloud}</div>)
}

function Button() {
    return (<button className={styles.buttonStyle} type="submit">Submit</button>)
}


export default WeatherForm;
