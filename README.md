
# **AI-Generated Trivial Pursuit Questions**

This web application runs entirely on the front end, so it only requires a static web page server. It generates trivia questions based on the player's **age** and **country of origin**.

The questions are generated using the OpenAI API. All you need is an OpenAI API key, which you'll enter in the setup form.

![Setup Form](images/pic1.png "Setup Form")

Players select their age and country, and the questions are tailored accordingly using the OpenAI API. The questions are both **age-appropriate** and **regionally relevant**.

---

## **Examples**

### *Kid Questions*
![Kid Question](images/pic2.png "Kid question")

### *Adult Questions*
![Adult Question](images/pic3.png "Adult question")

---

## **More Fun for the Whole Family**

With this app, the classic 80s game *Trivial Pursuit* becomes enjoyable for the entire family—even the youngest members. It encourages wholesome time together while helping everyone learn something new about the world and each other’s generations.

---

## **How Did This Project Come to Be?**

As a kid, I used to play *Trivial Pursuit* with my family, but the questions were always too difficult—they were aimed at Boomers and the Silent Generation. We Gen X kids were often left out.

Recently, I bought the game again to play with my parents over Christmas. This time, the questions were aimed at Millennials and Gen X, leaving my parents behind.

The real turning point was when friends (Millennials) and I (a Gen Xer) played the game together. The questions were once again geared toward older generations. While I could answer some, most of us lost interest after 30 minutes. Worse, my friends’ three adorable kids—who love playing board games—were completely excluded.

That's when I decided to create a web app that generates trivia questions based on **age**. A friend suggested also factoring in **country of origin** to make it more relevant for the kids. For example, a 4-year-old in the Netherlands was asked:  
> "What game is played with a bat and ball?"

But kids there mostly play *korfbal* (field hockey) or *voetbal* (soccer)—not baseball or cricket. That’s when we knew we needed to tighten things up.

It’s beyond me why **Parker Brothers** (the original publisher of Trivial Pursuit) never did this—but I’m glad I did!

Now all we need is autumn or winter, and we’re ready for some quality family trivia time.

---

## **How to Run the Project**

Simply run a small web server. I use [`http-server`](https://www.npmjs.com/package/http-server), but any static server will do:

```bash
http-server -d public
```

Then, open the provided URL in your browser. You can host this for free on Azure, AWS, or any cloud provider—it's just a tiny static web page.

---

## **Costs**

The OpenAI API is relatively expensive. If you're familiar with LLMs, you know they don't maintain an "active" memory state. To avoid repeating questions during a session, we feed previous questions back into the prompt using "assistant messages."

As the game progresses, the prompt grows, increasing API costs. I estimate the cost at around **$0.015 per question**. This is because we use the **GPT-4 Turbo** model, which is necessary to generate high-quality, age- and country-appropriate questions.

As OpenAI prices drop, we anticipate being able to generate an entire game’s worth of questions for around **$0.10**.

---

Enjoy trivia that actually fits *your* world!