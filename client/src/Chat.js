import React, { useState } from "react";

import {
  ApolloClient,
  InMemoryCache,
  useMutation,
  useSubscription,
  gql,
  useQuery,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { Container, Chip, Grid, TextField, Button } from "@material-ui/core";

const link = new WebSocketLink({
  uri: `ws://localhost:4000/`,
  options: {
    reconnect: true,
  },
});

export const client = new ApolloClient({
  link,
  uri: "http://localhost:4000/", //connect to server
  cache: new InMemoryCache(),
});

const GET_MESSAGES = gql`
  subscription {
    messages {
      id
      user
      text
    }
  }
`;

const GET_USER = gql`
  query ($name: String!) {
    user(name: $name) {
      id
      name
    }
  }
`;

const POST_MESSAGE = gql`
  mutation ($userId: Int!, $text: String!) {
    postMessage(userId: $userId, text: $text)
  }
`;

const CREATE_USER = gql`
  mutation ($name: String!) {
    createUser(name: $name)
  }
`;

const Messages = ({ user }) => {
  const { data, error } = useSubscription(GET_MESSAGES);
  if (error) {
    console.log(error);
    return <div>error</div>;
  }
  if (!data) {
    return null;
  }
  return (
    <div style={{ marginBottom: "5rem" }}>
      {data.messages.map(({ id, user: messageUser, text }) => {
        return (
          <div
            key={id}
            style={{ textAlign: user === messageUser ? "right" : "left" }}
          >
            <p style={{ marginBottom: "0.3rem" }}>{messageUser}</p>
            <Chip
              style={{ fontSize: "0.9rem" }}
              color={user === messageUser ? "primary" : "secondary"}
              label={text}
            />
          </div>
        );
      })}
    </div>
  );
};

export const Chat = () => {
  const [user, setUser] = useState("Majid");
  const [userId, setUserId] = useState();
  const [text, setText] = useState("");
  const [postMessage] = useMutation(POST_MESSAGE);
  const [createUser] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      setUserId(data?.id);
    },
  });
  const { data, error, loading, refetch } = useQuery(GET_USER, {
    variables: { name: user },
    onCompleted: (data) => {
      setUserId(data?.user?.id);
    },
  });

  // if (loading) {
  //   return <div>loading</div>;
  // }

  if (error) {
    console.log(error);
    return <div>error</div>;
  }
  // if (data) {
  //   console.log(data.user);
  // }

  // const id = data?.user?.id;
  const sendMessage = () => {
    // if (!userId) {
    //   createUser({
    //     variables: {
    //       name: user,
    //     },
    //   });
    // }
    // refetch({ name: user });
    if (text.length > 0 && userId) {
      postMessage({
        variables: {
          userId: +userId,
          text: text,
        },
      });
      setText("");
    } else {
      alert("Missing fields!");
    }
  };

  return (
    <Container>
      <h3>Welcome to DevThoughts! A simple chat app for the GraphQL series!</h3>
      <Messages user={user} />
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <TextField
            onChange={(e) => {
              setUser(e.target.value);
            }}
            onBlur={(e) => {
              if (!userId) {
                createUser({ variables: { name: user } });
              }
            }}
            value={user}
            size="small"
            fullWidth
            variant="outlined"
            required
            label="Required"
            label="Enter name"
          />
        </Grid>
        <Grid item xs={8}>
          <TextField
            onChange={(e) => {
              setText(e.target.value);
            }}
            value={text}
            size="small"
            fullWidth
            variant="outlined"
            required
            label="Required"
            label="Enter message here"
          />
        </Grid>
        <Grid item xs={1}>
          <Button
            onClick={sendMessage}
            fullWidth
            variant="contained"
            style={{ backgroundColor: "#60a820", color: "white" }}
          >
            Send
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};
