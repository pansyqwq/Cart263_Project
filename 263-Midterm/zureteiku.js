class GreyCircle {

    constructor(x, y, size, color) {

        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;

        // create the DOM element
        this.circleDiv = document.createElement("div");
    }

    renderCircle() {

        this.circleDiv.style.position = "absolute";

        this.circleDiv.style.width = this.size + "px";
        this.circleDiv.style.height = this.size + "px";

        this.circleDiv.style.background = this.color;

        this.circleDiv.style.borderRadius = "50%";

        // center offset
        this.circleDiv.style.left = this.x - this.size/2 + "px";
        this.circleDiv.style.top = this.y - this.size/2 + "px";

        // add to visual container
        document.querySelector(".a-visuals").appendChild(this.circleDiv);
    }

}