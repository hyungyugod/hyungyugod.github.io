---
layout: page
title: styleguide
permalink: /styleguide/
image: '/images/50.jpg'
---

A paragraph looks like this — dolor amet cray stumptown fingerstache neutra food truck seitan poke cardigan waistcoat VHS snackwave celiac hella. Godard seitan shoreditch flexitarian next level trust fund man braid vegan listicle keytar bitters. Disrupt cray fashion axe unicorn lomo shaman poke glossier keffiyeh snackwave austin tattooed seitan hexagon lo-fi. Lumbersexual irony vaporware, butcher shaman.

***

## Headings by default:

# H1 For example
## H2 For example
### H3 For example
#### H4 For example
##### H5 For example
###### H6 For example

```markdown
## Heading first level
### Heading second level
#### Heading third level
```

***

## Lists

#### Ordered list example:

1. Poutine drinking vinegar bitters.
2. Coloring book distillery fanny pack.
3. Venmo biodiesel gentrify enamel pin meditation.
4. Jean shorts shaman listicle pickled portland.
5. Salvia mumblecore brunch iPhone migas.

```markdown
1. Order list item 1
2. Order list item 1
```

***

#### Unordered list example:

* Bitters semiotics vice thundercats synth.
* Literally cred narwhal bitters wayfarers.
* Kale chips chartreuse paleo tbh street art marfa.
* Mlkshk polaroid sriracha brooklyn.
* Pug you probably haven't heard of them air plant man bun.

```markdown
* Unordered list item 1
* Unordered list item 2
```

***

### Table

<div class="table-container">
  <table>
    <tr><th>Header 1</th><th>Header 2</th><th>Header 3</th><th>Header 4</th><th>Header 5</th></tr>
    <tr><td>Row:1 Cell:1</td><td>Row:1 Cell:2</td><td>Row:1 Cell:3</td><td>Row:1 Cell:4</td><td>Row:1 Cell:5</td></tr>
    <tr><td>Row:2 Cell:1</td><td>Row:2 Cell:2</td><td>Row:2 Cell:3</td><td>Row:2 Cell:4</td><td>Row:2 Cell:5</td></tr>
    <tr><td>Row:3 Cell:1</td><td>Row:3 Cell:2</td><td>Row:3 Cell:3</td><td>Row:3 Cell:4</td><td>Row:3 Cell:5</td></tr>
    <tr><td>Row:4 Cell:1</td><td>Row:4 Cell:2</td><td>Row:4 Cell:3</td><td>Row:4 Cell:4</td><td>Row:4 Cell:5</td></tr>
    <tr><td>Row:5 Cell:1</td><td>Row:5 Cell:2</td><td>Row:5 Cell:3</td><td>Row:5 Cell:4</td><td>Row:5 Cell:5</td></tr>
    <tr><td>Row:6 Cell:1</td><td>Row:6 Cell:2</td><td>Row:6 Cell:3</td><td>Row:6 Cell:4</td><td>Row:6 Cell:5</td></tr>
  </table>
</div>

***

## Quotes

#### A quote looks like this:

> The longer I live, the more I realize that I am never wrong about anything, and that all the pains I have so humbly taken to verify my notions have only wasted my time!
>
> <cite>George Bernard Shaw</cite>

```html
> The longer I live, the more I realize that I am never wrong about anything, and that all the pains I have so humbly taken to verify my notions have only wasted my time!
>
> <cite>George Bernard Shaw</cite>
```

***

## Callouts

{: .note }
Useful information that users should know, even when skimming content.

{: .tip }
Helpful advice for doing things better or more easily.

{: .important }
Key information users need to know to achieve their goal.

{: .warning }
Urgent info that needs immediate user attention to avoid problems.

{: .caution }
Advises about risks or negative outcomes of certain actions.

```markdown
{: .note }
Useful information that users should know, even when skimming content.
```

```markdown
{: .tip }
Helpful advice for doing things better or more easily.
```

```markdown
{: .important }
Key information users need to know to achieve their goal.
```

```markdown
{: .warning }
Urgent info that needs immediate user attention to avoid problems.
```

```markdown
{: .caution }
Advises about risks or negative outcomes of certain actions.
```

***

## Syntax Highlighter

```js
  $('.top').click(function () {
    $('html, body').stop().animate({ scrollTop: 0 }, 'slow', 'swing');
  });
  $(window).scroll(function () {
    if ($(this).scrollTop() > $(window).height()) {
      $('.top').addClass("top-active");
    } else {
      $('.top').removeClass("top-active");
    };
  });
```

***

## Images

![]({{site.baseurl}}/images/60.jpg#wide)
*Keep going*

<div class="gallery-box">
  <div class="gallery">
    <img src="/images/501.jpg">
    <img src="/images/901.jpg">
    <img src="/images/509.jpg">
    <img src="/images/511.jpg">
    <img src="/images/520.jpg">
    <img src="/images/516.jpg">
    <img src="/images/517.jpg">
    <img src="/images/519.jpg">
    <img src="/images/521.jpg">
  </div>
  <em>Gallery / <a href="https://unsplash.com/" target="_blank">Unsplash</a></em>
</div>

```markdown
  <div class="gallery-box">
    <div class="gallery">
      <img src="/images/501.jpg">
      <img src="/images/901.jpg">
      <img src="/images/509.jpg">
      <img src="/images/511.jpg">
      <img src="/images/520.jpg">
      <img src="/images/516.jpg">
      <img src="/images/517.jpg">
      <img src="/images/519.jpg">
      <img src="/images/521.jpg">
    </div>
    <em>Gallery / <a href="https://unsplash.com/" target="_blank">Unsplash</a></em>
  </div>
```

![]({{site.baseurl}}/images/140.jpg)
*Minimalism*

```markdown
  ![]({{site.baseurl}}/images/140.jpg)
  *Minimalism*
```

***

## Youtube Embed

<p><iframe src="https://www.youtube.com/embed/Hd1_EXhr_fg" loading="lazy" frameborder="0" allowfullscreen></iframe></p>

```html
  <iframe src="https://www.youtube.com/embed/Hd1_EXhr_fg" frameborder="0" allowfullscreen></iframe>
```

## Vimeo Embed

<p><iframe src="https://player.vimeo.com/video/107654760" loading="lazy" width="640" height="360" frameborder="0" allowfullscreen></iframe></p>

```html
  <iframe src="https://player.vimeo.com/video/107654760" width="640" height="360" frameborder="0" allowfullscreen></iframe>
```

***