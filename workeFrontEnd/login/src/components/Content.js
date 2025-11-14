import React, { Component } from "react";

class Content extends Component {
  render() {
    return (
      <section>
        <p>
          Nick Name <input type="text" name="nickname"></input>
        </p>
        <p>
          Stress{" "}
          <input type="number" name="stress" min="0" max="100" step="5"></input>
        </p>
        <input
          type="button"
          value="complete"
          onClick={function () {}.bind(this)}
        ></input>
      </section>
    );
  }
}

export default Content;
