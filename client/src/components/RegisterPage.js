import React from "react";
import PropTypes from "prop-types";
import pickBy from "lodash/pickBy";
import { Redirect, Link } from "react-router-dom";
import gql from "graphql-tag";
import { Mutation } from "react-apollo";
import { queryGenFromComponent } from "../GraphQLRoute";
import HomePage from "./HomePage";
import LoadingPage from "./LoadingPage";
import ErrorPage from "./ErrorPage";
import "./form-table.css";

const REGISTER = gql`
  mutation Register(
    $username: String!
    $email: String!
    $password: String!
    $name: String
    $avatarUrl: String
  ) {
    register(
      input: {
        username: $username
        email: $email
        password: $password
        name: $name
        avatarUrl: $avatarUrl
      }
    ) {
      user {
        nodeId
        username
      }
    }
  }
`;

export default class RegisterPage extends React.Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  state = {
    username: "",
    email: "",
    password: "",
    repeatPassword: "",
    name: "",
    avatarUrl: "",
    error: null,
    loggingIn: false,
  };

  getNext() {
    return "/";
  }

  handleUsernameChange = e => {
    this.setState({ username: e.target.value, error: null });
  };

  handleEmailChange = e => {
    this.setState({ email: e.target.value, error: null });
  };

  handlePasswordChange = e => {
    this.setState({ password: e.target.value, error: null });
  };

  handleRepeatPasswordChange = e => {
    this.setState({ repeatPassword: e.target.value, error: null });
  };

  handleNameChange = e => {
    this.setState({ name: e.target.value, error: null });
  };

  handleAvatarUrlChange = e => {
    this.setState({ avatarUrl: e.target.value, error: null });
  };

  handleSubmitWith = register => async e => {
    e.preventDefault();
    const { history } = this.props;
    const { username, email, password, name, avatarUrl } = this.state;
    this.setState({ loggingIn: true });
    try {
      const { data } = await register({
        variables: pickBy({
          username,
          email,
          password,
          name,
          avatarUrl,
        }),
      });
      if (data.register && data.register.user) {
        this.setState({ loggingIn: false, error: null });
        history.push(this.getNext());
      } else {
        throw new Error("Registration failed");
      }
    } catch (_e) {
      this.setState({
        loggingIn: false,
        error: "Registration failed",
      });
    }
  };

  static QueryFragment = gql`
    fragment RegisterPage_QueryFragment on Query {
      currentUser {
        nodeId
      }
    }
  `;

  render() {
    const { data, loading, error } = this.props;
    const {
      username,
      email,
      password,
      repeatPassword,
      name,
      avatarUrl,
      loggingIn,
    } = this.state;
    if (loading) return <LoadingPage />;
    if (error) {
      return (
        <ErrorPage>
          We failed talking to the server. Please reload the page.
        </ErrorPage>
      );
    }
    if (data.currentUser) {
      return <Redirect to={this.getNext()} />;
    }
    const usernameBadLength = username.length === 1 || username.length > 24;
    const usernameBadFormat =
      username.length > 0 && !/^[a-zA-Z]([a-zA-Z0-9][_]?)+$/.test(username);
    const emailBadFormat =
      email.length > 0 && !/[^@]+@[^@]+\.[^@]+/.test(email);
    const mismatchedPasswords = password !== repeatPassword;
    const avatarUrlBadFormat =
      avatarUrl.length > 0 && !/^https?:\/\/[^/]+/.test(avatarUrl);
    return (
      <div>
        <h3>Register</h3>
        <Mutation
          mutation={REGISTER}
          update={(
            cache,
            {
              data: {
                register: { user },
              },
            }
          ) => {
            const query = queryGenFromComponent(HomePage);
            const cacheData = cache.readQuery({ query });
            const newData = {
              ...cacheData,
              currentUser: user,
            };
            cache.writeQuery({ query, data: newData });
          }}
        >
          {register => (
            <form onSubmit={this.handleSubmitWith(register)}>
              <table className="form-table">
                <tbody>
                  <tr>
                    <th>Username:</th>
                    <td>
                      <input
                        type="text"
                        value={username}
                        onChange={this.handleUsernameChange}
                      />
                      {usernameBadLength && (
                        <span className="error">
                          Username must be between 2 and 24 characters long
                        </span>
                      )}
                      {usernameBadLength && usernameBadFormat && ", "}
                      {usernameBadFormat && (
                        <span className="error">Invalid username</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Email:</th>
                    <td>
                      <input
                        type="email"
                        value={email}
                        onChange={this.handleEmailChange}
                      />
                      {emailBadFormat && (
                        <span className="error">Invalid email</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Password:</th>
                    <td>
                      <input
                        type="password"
                        value={password}
                        onChange={this.handlePasswordChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Repeat Password:</th>
                    <td>
                      <input
                        type="password"
                        value={repeatPassword}
                        onChange={this.handleRepeatPasswordChange}
                      />
                      {mismatchedPasswords && (
                        <span className="error">Passwords must match</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Name:</th>
                    <td>
                      <input
                        type="text"
                        value={name}
                        onChange={this.handleNameChange}
                      />
                      <span className="help-text">(optional)</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Avatar URL:</th>
                    <td>
                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={this.handleAvatarUrlChange}
                      />
                      {avatarUrlBadFormat ? (
                        <span className="error">Invalid URL</span>
                      ) : (
                        <span className="help-text">(optional)</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
              {this.state.error ? (
                <p className="error">{this.state.error}</p>
              ) : null}
              <button
                type="submit"
                disabled={
                  !username ||
                  !email ||
                  !password ||
                  usernameBadLength ||
                  usernameBadFormat ||
                  emailBadFormat ||
                  mismatchedPasswords ||
                  avatarUrlBadFormat ||
                  loggingIn
                }
              >
                Register
              </button>
              <Link to="/login">Already have an account? Log in</Link>
            </form>
          )}
        </Mutation>
        <p>
          <button
            type="button"
            onClick={() => (window.location = "/auth/github")}
          >
            Login with GitHub
          </button>
        </p>
      </div>
    );
  }
}
