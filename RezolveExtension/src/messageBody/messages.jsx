import { useEffect, useRef } from 'react';
import MessageBubble from './messagebubble'
import styles from './styles/messages.module.css'
import * as AdaptiveCards from 'adaptivecards'
import MarkdownIt from "markdown-it"
import { performSearch } from '../utils/requests';

const dummyCard = {
    "type": "AdaptiveCard",
    "body": [
        {
            "type": "TextBlock",
            "size": "Large",
            "weight": "Bolder",
            "text": "Welcome to Adaptive Cards!"
        },
        {
            "type": "Image",
            "url": "https://adaptivecards.io/content/cats/2.png",
            "size": "Medium",
            "style": "Person"
        },
        {
            "type": "TextBlock",
            "text": "This is a dummy card for testing in React.",
            "wrap": true
        }
    ],
    "actions": [
        {
            "type": "Action.OpenUrl",
            "title": "Visit AdaptiveCards.io",
            "url": "https://adaptivecards.io"
        }
    ],
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "version": "1.6"
};

const markdown = new MarkdownIt();
AdaptiveCards.AdaptiveCard.onProcessMarkdown = (text, result) => {
    result.outputHtml = markdown.render(text);
    result.didProcess = true;
};

export default function Messages({ messages }) {
    const cardRef = useRef(null);

    useEffect(() => {
        (async () => {
            const res = await performSearch('what is the dress policiy at Rezolve AI?');
            console.log(res);
        })()

        const adaptiveCard = new AdaptiveCards.AdaptiveCard();
        adaptiveCard.parse(dummyCard);

        adaptiveCard.onExecuteAction = (action) => {
            if (action.getJsonTypeName() === "Action.OpenUrl") {
                const url = action.url;
                if (url) {
                    window.open(url, "_blank"); // ✅ open in new tab
                }
            } else if (action.getJsonTypeName() === "Action.Submit") {
                console.log("Submit action:", action.data);
            }
        };

        if (cardRef.current) {
            const rendered = adaptiveCard.render();
            cardRef.current.innerHTML = '';
            cardRef.current.appendChild(rendered);
        }
    }, []);


    return (
        <div id='messageBody' className={styles.main}>
            <div
                ref={cardRef}
                style={{
                    display: 'flex',
                    justifyContent: 'left',
                    width: '100%'
                }}
            />
            {messages.map(val => {
                if (val.user == 1) {
                    return (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'right' }}>
                            <MessageBubble text={val.text} />
                        </div>
                    )
                } else {
                    return (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'left' }}>
                            <MessageBubble text={val.text} user={0} />
                        </div>
                    )
                }
            })}
        </div>
    )
}