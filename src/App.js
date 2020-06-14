import React, {useState, useEffect} from 'react';
import PubNub from 'pubnub';
import {PubNubProvider, PubNubConsumer} from 'pubnub-react';
import './App.css';

var pubnubDemo = new PubNub({
    publishKey: 'pub-c-8548ab3d-03b4-4440-b866-5a6b48c7caff',
    subscribeKey: 'sub-c-8ad0adf8-abd4-11ea-adee-16aa024ec639',
});

const directions = ['North', 'East', 'South', 'West'];

function App() {

    const [messages, addMessage] = useState([]);
    const [message, setMessage] = useState('');
    const [currDirection, setCurrDirection] = useState(0);
    const [useOrientation, setUsingOrientation] = useState(false);
    const [alpha, setAlpha] = useState(null);

    useEffect(() => {
        //clear message board
        addMessage([]);

        //fill message board
        pubnubDemo.fetchMessages(
            {
                channels: [directions[currDirection]],
                count: 25
            },
            function (status, response) {
                const temp = [];
                if (response.channels[directions[currDirection]] !== undefined) {
                    response.channels[directions[currDirection]].map(message => {
                        return temp.push(message.message);
                    });
                }

                addMessage(temp);
            }
        )
    }, [currDirection]);

    function givePermission() {
        setUsingOrientation(true);
        // feature detect
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', function (event) {
                            handleOrientation(event);
                        }, true);
                    }
                })
                .catch(console.error);
        } else {
            // just serve up the EventListener w/o permissions here
            window.addEventListener('deviceorientation', function (event) {
                handleOrientation(event);
            }, true);
        }
    }

    function handleOrientation(event) {
        console.log("HANDLING ORIENTATION");
        var heading = event.alpha;

        // some browsers don't understand "alpha"
        if (typeof event.webkitCompassHeading !== "undefined") {
            heading = event.webkitCompassHeading;
        }
        //not working
        heading = heading.toFixed([0]);
        setAlpha(heading);

        console.log("HEADING " + heading);

        //north index = 0
        if (heading < 45 || heading >= 315) {
            return changeDirection(event, 0);
        }
        //east index = 1
        else if (heading < 135 && heading >= 45) {
            return changeDirection(event, 1);
        }
        //south index = 2
        else if (heading < 225 && heading >= 135) {
            return changeDirection(event, 2);
        }
        //west index = 3
        else {
            return changeDirection(event, 3);
        }
    }

    const sendMessage = (message) => {
        pubnubDemo.publish({
                channel: directions[currDirection],
                message
            },
            () => setMessage('')
        );
    };

    const changeDirection = (e, index) => {
        if (index === currDirection) {
            return;
        }

        pubnubDemo.unsubscribe({
            channels: [directions[currDirection]]
        });

        setCurrDirection(index);

        e.stopPropagation();
    };

    //putting it all together using react
    return (
        <PubNubProvider client={pubnubDemo}>
            <div className="App">
                <header className="App-header">
                    <PubNubConsumer>
                        {client => {
                            client.addListener({
                                message: (messageEvent) => {
                                    addMessage([...messages, messageEvent.message]);
                                },
                            });

                            client.subscribe({channels: [directions[currDirection]]});
                        }}
                    </PubNubConsumer>
                    <div
                        style={{
                            width: '80%',
                            height: '500px'
                        }}>
                        <div style={{background: 'limegreen', alignment: 'start', fontSize: '30px'}}>
                            <b>Orientation Chat</b>
                        </div>
                        <div
                            style={{
                                background: 'white',
                                height: '100%',
                                overflow: 'scroll',
                            }}>
                            <div>
                                <span style={{color: 'black'}}>{`>>> Channel ${directions[currDirection]} <<<`}</span>
                                {useOrientation &&
                                <span style={{color: 'black'}}>{alpha}</span>}
                            </div>
                            {messages.map((message, messageIndex) => {
                                return (
                                    <div
                                        key={`message-${messageIndex}`}
                                        style={{
                                            display: 'inline-block',
                                            float: 'left',
                                            background: '#eeffee',
                                            color: 'black',
                                            borderRadius: '10px',
                                            margin: '5px',
                                            padding: '8px 15px',
                                        }}>{message}</div>
                                );
                            })}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                height: '50px',
                                background: 'black',
                            }}
                        >
                            <input
                                type="text"
                                style={{
                                    flexGrow: 1,
                                    fontSize: '18px',
                                }}
                                placeholder="type here..."
                                value={message}
                                onChange={e => {
                                    setMessage(e.target.value)
                                }}
                            />
                            <button
                                style={{
                                    background: 'forestgreen',
                                    color: 'white',
                                    width: '100px',
                                    fontSize: '18px',
                                }}
                                onClick={e => {
                                    e.preventDefault();
                                    sendMessage(message);
                                }}
                            >send
                            </button>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            {!useOrientation &&
                            <div>
                                <button className='App-button' onClick={(e) => changeDirection(e, 0)}>NORTH</button>
                                <button className='App-button' onClick={(e) => changeDirection(e, 1)}>EAST</button>
                                <button className='App-button' onClick={(e) => changeDirection(e, 2)}>SOUTH</button>
                                <button className='App-button' onClick={(e) => changeDirection(e, 3)}>WEST</button>
                                <button className='App-button' style={{fontSize: '14px', background: 'dodgerblue'}} onClick={givePermission}> Detect Orientation </button>
                            </div>}
                        </div>
                    </div>
                </header>
            </div>
        </PubNubProvider>
    );
}

export default App;