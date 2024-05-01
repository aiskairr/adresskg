let maps = document.querySelector(".map")
let hrefed = document.querySelectorAll("#hrefed")


hrefed.forEach((el) => {
    el.removeAttribute("href")
})
maps.innerHTML = `
<iframe src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d466.58267811121124!2d74.58362356467835!3d42.830785915988514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1z0L_RgNC-0YHQv9C10LrRgiDQp9GL0L3Qs9GL0LfQsCDQkNC50YLQvNCw0YLQvtCy0LAsIDk3LzM!5e0!3m2!1sru!2skz!4v1714561168862!5m2!1sru!2skz" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
`
